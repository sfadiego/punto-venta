<?php

namespace Tests\Orders;

use App\Enums\BusinessTypeEnum;
use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\ReturnReasonEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\OrderReturnModel;
use App\Models\PaymentMethodModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Comprobante de devolución (GET /api/order/{order}/return/{return}/print/bytes y POST .../print):
 * ticket ESC/POS con lo devuelto, el motivo y el reembolso (método y/o saldo del cliente).
 */
class OrderReturnTicketTest extends TestCase
{
    private MainOrderReportModel $caja;

    private PaymentMethodModel $efectivo;

    protected function setUp(): void
    {
        parent::setUp();

        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value,
            BusinessConfigModel::STOCK_ENABLED => true,
        ]);

        $this->efectivo = PaymentMethodModel::create([PaymentMethodModel::NAME => 'Efectivo', PaymentMethodModel::ACTIVE => true]);
        $this->caja = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    /** Venta de $precio × $cantidad y una devolución de $devuelto piezas; devuelve [orden, devolución]. */
    private function devolucion(float $precio = 149, float $cantidad = 2, float $devuelto = 1, array $orden = [], array $payload = []): array
    {
        $producto = ProductModel::create([
            ProductModel::NOMBRE => 'Aretes de plata 925',
            ProductModel::PRECIO => $precio,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => true,
            ProductModel::STOCK => 10,
        ]);
        $total = round($precio * $cantidad, 2);
        $venta = OrderModel::create(array_merge([
            OrderModel::NOMBRE_PEDIDO => 'Venta mostrador',
            OrderModel::SISTEMA_ID => $this->caja->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::PAYMENT_METHOD_ID => $this->efectivo->id,
            OrderModel::TOTAL => $total,
            OrderModel::SUBTOTAL => $total,
            OrderModel::DESCUENTO => 0,
        ], $orden));

        // El crédito de la venta ya se cargó al cliente (lo hace OrderCreditService al cerrarla).
        if (! empty($venta->is_credit)) {
            DB::table('order')->where('id', $venta->id)->update(['credit_applied_at' => now()]);
            $venta->refresh();
        }
        $linea = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $venta->id,
            OrderProductModel::PRODUCTO_ID => $producto->id,
            OrderProductModel::CANTIDAD => $cantidad,
            OrderProductModel::PRECIO => $precio,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $this->postJson("/api/order/{$venta->id}/return", array_merge([
            'reason' => ReturnReasonEnum::Defective->value,
            'items' => [['order_product_id' => $linea->id, 'quantity' => $devuelto]],
        ], $payload), $this->authHeaders())->assertStatus(200);

        return [$venta, OrderReturnModel::latest('id')->first()];
    }

    private function bytes(OrderModel $orden, OrderReturnModel $devolucion, ?User $usuario = null)
    {
        return $this->get(
            "/api/order/{$orden->id}/return/{$devolucion->id}/print/bytes",
            array_merge($this->authHeaders($usuario), ['Accept' => '*/*'])
        );
    }

    public function test_el_comprobante_trae_lo_devuelto_el_motivo_y_el_reembolso(): void
    {
        [$orden, $devolucion] = $this->devolucion();

        $response = $this->bytes($orden, $devolucion)->assertStatus(200);
        $content = $response->getContent();

        $this->assertStringContainsString('application/octet-stream', $response->headers->get('Content-Type'));
        foreach (['COMPROBANTE DE DEVOLUCION', 'Producto defectuoso', 'Aretes de plata 925', '1 pza', 'TOTAL REEMBOLSADO:', '$149.00', 'Efectivo:'] as $expected) {
            $this->assertStringContainsString($expected, $content);
        }
    }

    public function test_una_devolucion_sin_reembolso_lo_indica(): void
    {
        [$orden, $devolucion] = $this->devolucion(payload: ['refund' => false]);

        $content = $this->bytes($orden, $devolucion)->assertStatus(200)->getContent();

        $this->assertStringContainsString('SIN REEMBOLSO', $content);
        $this->assertStringNotContainsString('TOTAL REEMBOLSADO', $content);
        // Un defectuoso (el motivo por defecto de estas pruebas) se da de baja: no "regresa" al inventario.
        $this->assertStringContainsString('Piezas dadas de baja (merma)', $content);
        $this->assertStringNotContainsString('devueltas al inventario', $content);
    }

    public function test_sin_reembolso_y_sin_defecto_las_piezas_vuelven_al_inventario(): void
    {
        [$orden, $devolucion] = $this->devolucion(payload: ['refund' => false, 'reason' => ReturnReasonEnum::NotWanted->value]);

        $content = $this->bytes($orden, $devolucion)->assertStatus(200)->getContent();

        $this->assertStringContainsString('Piezas devueltas al inventario', $content);
    }

    public function test_el_ticket_solo_usa_caracteres_ascii_en_las_columnas_de_importes(): void
    {
        [$orden, $devolucion] = $this->devolucion(payload: ['refund' => false]);

        $content = $this->bytes($orden, $devolucion)->assertStatus(200)->getContent();

        // El guion largo (3 bytes en UTF-8) se imprime como símbolo roto en una térmica.
        $this->assertStringNotContainsString("\xE2\x80\x94", $content);
    }

    public function test_una_venta_a_credito_detalla_el_saldo_del_cliente(): void
    {
        $cliente = CustomerModel::create([
            CustomerModel::NAME => 'Maria Lopez',
            CustomerModel::BALANCE => 100,
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        [$orden, $devolucion] = $this->devolucion(100, 1, 1, [
            OrderModel::IS_CREDIT => true,
            OrderModel::CUSTOMER_ID => $cliente->id,
            OrderModel::PAYMENT_METHOD_ID => null,
        ]);

        $content = $this->bytes($orden, $devolucion)->assertStatus(200)->getContent();

        $this->assertStringContainsString('Maria Lopez', $content);
        $this->assertStringContainsString('Saldo del cliente:', $content);
        $this->assertStringContainsString('$100.00', $content);
    }

    public function test_usa_el_ancho_del_papel_del_negocio(): void
    {
        [$orden, $devolucion] = $this->devolucion();

        BusinessConfigModel::first()->update([BusinessConfigModel::PAPER_WIDTH => '58']);
        $this->assertStringContainsString(str_repeat('=', 32), $this->bytes($orden, $devolucion)->getContent());

        BusinessConfigModel::first()->update([BusinessConfigModel::PAPER_WIDTH => '80']);
        $this->assertStringContainsString(str_repeat('=', 48), $this->bytes($orden, $devolucion)->getContent());
    }

    public function test_la_devolucion_debe_pertenecer_a_la_orden(): void
    {
        [, $devolucion] = $this->devolucion();
        [$otraOrden] = $this->devolucion(50, 1, 1);

        $this->bytes($otraOrden, $devolucion)->assertStatus(404);
    }

    public function test_sin_autenticacion_o_sin_permiso_de_impresion_no_accede(): void
    {
        // Primero la petición sin token: el guard de Sanctum cachea al primer usuario autenticado.
        $this->getJson('/api/order/1/return/1/print/bytes')->assertStatus(401);
        [$orden, $devolucion] = $this->devolucion();

        // Configurado con otro permiso, para no caer en el fallback a DEFAULTS.
        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => RoleEnum::CAJA->value,
            RolePermission::PERMISSION_ID => Permission::where(Permission::KEY, 'viewOrders')->firstOrFail()->id,
        ]);
        $caja = User::factory()->create([User::ROL_ID => RoleEnum::CAJA->value, User::TENANT_ID => BusinessConfigModel::first()->id]);

        $this->bytes($orden, $devolucion, $caja)->assertStatus(403);
    }

    public function test_imprimir_en_el_servidor_sin_impresora_responde_error_generico(): void
    {
        [$orden, $devolucion] = $this->devolucion();

        $this->postJson("/api/order/{$orden->id}/return/{$devolucion->id}/print", [], $this->authHeaders())
            ->assertStatus(422)
            ->assertJsonPath('message', 'No se pudo imprimir el ticket, intenta de nuevo.');
    }
}
