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
 * Reembolso de una devolución (POST /api/order/{order}/return): lo que el cliente pagó por las piezas
 * (con los descuentos de línea y de orden, sin propina ni domicilio), por el método elegido y desde la
 * caja abierta; en una venta a crédito baja primero el saldo del cliente. El cuadre de caja de la
 * sesión donde se reembolsa lo descuenta. Plazo configurable y permiso propio.
 */
class OrderReturnRefundTest extends TestCase
{
    private MainOrderReportModel $caja;

    private PaymentMethodModel $efectivo;

    private PaymentMethodModel $tarjeta;

    protected function setUp(): void
    {
        parent::setUp();

        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value,
            BusinessConfigModel::STOCK_ENABLED => true,
        ]);

        $this->efectivo = PaymentMethodModel::create([PaymentMethodModel::NAME => 'Efectivo', PaymentMethodModel::ACTIVE => true]);
        $this->tarjeta = PaymentMethodModel::create([PaymentMethodModel::NAME => 'Tarjeta', PaymentMethodModel::ACTIVE => true]);
        $this->caja = $this->abrirCaja();
    }

    private function abrirCaja(): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    /** Orden cerrada en la caja de la prueba, con una línea de $cantidad piezas a $precio. */
    private function ordenCerrada(float $precio, float $cantidad, array $overrides = [], float $descuentoLinea = 0): array
    {
        $producto = ProductModel::create([
            ProductModel::NOMBRE => 'Producto '.uniqid(),
            ProductModel::PRECIO => $precio,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => true,
            ProductModel::STOCK => 10,
        ]);

        $orden = OrderModel::create(array_merge([
            OrderModel::NOMBRE_PEDIDO => 'Venta',
            OrderModel::SISTEMA_ID => $this->caja->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::PAYMENT_METHOD_ID => $this->efectivo->id,
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
            OrderModel::DESCUENTO => 0,
        ], $overrides));

        // El crédito de la venta ya se cargó al cliente (lo hace OrderCreditService al cerrarla).
        if (! empty($orden->is_credit)) {
            DB::table('order')->where('id', $orden->id)->update(['credit_applied_at' => now()]);
            $orden->refresh();
        }

        $linea = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $producto->id,
            OrderProductModel::CANTIDAD => $cantidad,
            OrderProductModel::PRECIO => $precio,
            OrderProductModel::DESCUENTO => $descuentoLinea,
        ]);

        // Total de la orden = lo que pagó el cliente por la línea, como lo calcula el carrito.
        $subtotal = round($precio * $cantidad * (1 - $descuentoLinea / 100), 2);
        $orden->update([
            OrderModel::SUBTOTAL => $subtotal,
            OrderModel::TOTAL => round($subtotal * (1 - (float) $orden->descuento / 100), 2),
        ]);

        return [$orden->fresh(), $linea, $producto];
    }

    private function devolver(OrderModel $orden, OrderProductModel $linea, float $cantidad, array $extra = [], ?User $usuario = null)
    {
        return $this->postJson("/api/order/{$orden->id}/return", array_merge([
            'reason' => ReturnReasonEnum::NotWanted->value,
            'items' => [['order_product_id' => $linea->id, 'quantity' => $cantidad]],
        ], $extra), $this->authHeaders($usuario));
    }

    private function totalesCaja(MainOrderReportModel $caja)
    {
        return $this->getJson("/api/admin/system/{$caja->id}/total-current-sales", $this->authHeaders())->assertStatus(200);
    }

    private function totalDeMetodo(array $byMethod, ?int $methodId): float
    {
        return (float) (collect($byMethod)->firstWhere('payment_method_id', $methodId)['total'] ?? 0);
    }

    private function otorgarPermiso(RoleEnum $rol, string $key): void
    {
        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => $rol->value,
            RolePermission::PERMISSION_ID => Permission::where(Permission::KEY, $key)->firstOrFail()->id,
        ]);
    }

    // ── Monto del reembolso ───────────────────────────────

    public function test_reembolsa_lo_pagado_con_el_descuento_de_la_linea_y_el_de_la_orden(): void
    {
        // 2 piezas a $100 con 10% de descuento en la línea (180) y 10% en la orden (162): cada pieza vale 81.
        [$orden, $linea] = $this->ordenCerrada(100, 2, [OrderModel::DESCUENTO => 10], descuentoLinea: 10);

        $this->devolver($orden, $linea, 1)
            ->assertStatus(200)
            ->assertJsonPath('data.refund_amount', 81)
            ->assertJsonPath('data.balance_applied', 0)
            ->assertJsonPath('data.refund_payment_method_id', $this->efectivo->id)
            ->assertJsonPath('data.sistema_id', $this->caja->id)
            ->assertJsonPath('data.items.0.refund_amount', 81);
    }

    public function test_el_reembolso_no_incluye_propina_ni_domicilio(): void
    {
        [$orden, $linea] = $this->ordenCerrada(100, 1, [OrderModel::PROPINA => 15, OrderModel::COSTO_DOMICILIO => 30]);

        $this->devolver($orden, $linea, 1)->assertStatus(200)->assertJsonPath('data.refund_amount', 100);
    }

    public function test_devoluciones_parciales_suman_exactamente_lo_pagado(): void
    {
        // 3 piezas por $100: 33.33 + 33.33 + 33.34 — sin perder el centavo del redondeo.
        [$orden, $linea] = $this->ordenCerrada(100 / 3, 3);
        $linea->update([OrderProductModel::PRECIO => 33.33]);
        [$orden, $linea] = [$orden, $linea->fresh()];
        $pagado = round(33.33 * 3, 2);

        foreach ([1, 1, 1] as $unaPieza) {
            $this->devolver($orden, $linea, $unaPieza)->assertStatus(200);
        }

        $this->assertEquals($pagado, round(OrderReturnModel::sum('refund_amount'), 2));
    }

    public function test_la_ultima_devolucion_no_excede_lo_que_falta_por_reembolsar(): void
    {
        [$orden, $linea] = $this->ordenCerrada(50, 2);

        $this->devolver($orden, $linea, 2)->assertStatus(200)->assertJsonPath('data.refund_amount', 100);
        $this->devolver($orden, $linea, 1)->assertStatus(422);

        $this->assertEquals(100.0, (float) OrderReturnModel::sum('refund_amount'));
    }

    public function test_una_devolucion_solo_de_stock_previa_no_se_reembolsa_despues(): void
    {
        [$orden, $linea] = $this->ordenCerrada(100, 3);

        $this->devolver($orden, $linea, 1, ['refund' => false])->assertStatus(200)->assertJsonPath('data.refund_amount', 0);
        // Las 2 piezas que quedan valen 2/3 de la línea, no toda.
        $this->devolver($orden, $linea, 2)->assertStatus(200)->assertJsonPath('data.refund_amount', 200);
    }

    // ── Sin reembolso ─────────────────────────────────────

    public function test_sin_reembolso_solo_regresa_stock_y_no_exige_caja(): void
    {
        $this->caja->update([MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::CLOSED]);
        [$orden, $linea, $producto] = $this->ordenCerrada(100, 2);

        $this->devolver($orden, $linea, 1, ['refund' => false])
            ->assertStatus(200)
            ->assertJsonPath('data.refund_amount', 0)
            ->assertJsonPath('data.sistema_id', null);

        $this->assertEquals(11.0, (float) $producto->fresh()->stock);
    }

    // ── Método de pago y caja ─────────────────────────────

    public function test_por_defecto_se_reembolsa_por_el_metodo_de_la_venta_y_se_puede_cambiar(): void
    {
        [$orden, $linea] = $this->ordenCerrada(100, 2);

        $this->devolver($orden, $linea, 1)->assertStatus(200)->assertJsonPath('data.refund_payment_method_id', $this->efectivo->id);
        $this->devolver($orden, $linea, 1, ['refund_payment_method_id' => $this->tarjeta->id])
            ->assertStatus(200)
            ->assertJsonPath('data.refund_payment_method_id', $this->tarjeta->id);
    }

    public function test_sin_caja_abierta_rechaza_el_reembolso_y_no_toca_nada(): void
    {
        [$orden, $linea, $producto] = $this->ordenCerrada(100, 2);
        $this->caja->update([MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::CLOSED]);

        $this->devolver($orden, $linea, 1)->assertStatus(422)->assertJsonPath('message', 'Abre una caja para devolver dinero al cliente.');

        $this->assertSame(0, OrderReturnModel::count());
        $this->assertEquals(10.0, (float) $producto->fresh()->stock);
    }

    public function test_un_metodo_inactivo_o_inexistente_no_es_valido(): void
    {
        [$orden, $linea] = $this->ordenCerrada(100, 2);
        $inactivo = PaymentMethodModel::create([PaymentMethodModel::NAME => 'Cheque', PaymentMethodModel::ACTIVE => false]);

        $this->devolver($orden, $linea, 1, ['refund_payment_method_id' => $inactivo->id])->assertStatus(400);
        $this->devolver($orden, $linea, 1, ['refund_payment_method_id' => 999999])->assertStatus(400);
    }

    public function test_el_reembolso_se_descuenta_de_la_caja_donde_se_devuelve(): void
    {
        [$orden, $linea] = $this->ordenCerrada(100, 2);
        $cajaB = $this->abrirCaja();
        $this->caja->update([MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::CLOSED]);

        $this->devolver($orden, $linea, 1)->assertStatus(200)->assertJsonPath('data.sistema_id', $cajaB->id);

        // La caja de la venta (ya cerrada) conserva su corte; la sesión actual descuenta el reembolso.
        $this->assertEquals(200.0, $this->caja->fresh()->totalSalesByDay());
        $response = $this->totalesCaja($cajaB)
            ->assertJsonPath('data.bruto', -100)
            ->assertJsonPath('data.devoluciones.total', 100)
            ->assertJsonPath('data.devoluciones.cash_out', 100)
            ->assertJsonPath('data.devoluciones.count', 1);
        $this->assertEquals(-100, $this->totalDeMetodo($response->json('data.by_payment_method'), $this->efectivo->id));
    }

    public function test_el_reembolso_baja_el_total_de_la_misma_sesion_en_su_metodo(): void
    {
        [$orden, $linea] = $this->ordenCerrada(100, 2);

        $this->devolver($orden, $linea, 1, ['refund_payment_method_id' => $this->tarjeta->id])->assertStatus(200);

        $response = $this->totalesCaja($this->caja)->assertJsonPath('data.bruto', 100);
        $byMethod = $response->json('data.by_payment_method');
        $this->assertEquals(200, $this->totalDeMetodo($byMethod, $this->efectivo->id));
        $this->assertEquals(-100, $this->totalDeMetodo($byMethod, $this->tarjeta->id));
    }

    public function test_una_sesion_solo_con_devoluciones_no_se_considera_vacia(): void
    {
        [$orden, $linea] = $this->ordenCerrada(100, 2);
        $cajaB = $this->abrirCaja();
        $this->caja->update([MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::CLOSED]);
        $this->assertTrue($cajaB->isEmptySession());

        $this->devolver($orden, $linea, 1)->assertStatus(200);

        $this->assertFalse($cajaB->fresh()->isEmptySession());
        $this->postJson("/api/admin/system/{$cajaB->id}/close", [], $this->authHeaders())->assertStatus(200);
    }

    // ── Ventas a crédito ──────────────────────────────────

    private function ventaACredito(float $total, float $saldo): array
    {
        $cliente = CustomerModel::create([
            CustomerModel::NAME => 'Cliente crédito',
            CustomerModel::BALANCE => $saldo,
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        [$orden, $linea] = $this->ordenCerrada($total, 1, [
            OrderModel::IS_CREDIT => true,
            OrderModel::CUSTOMER_ID => $cliente->id,
            OrderModel::PAYMENT_METHOD_ID => null,
        ]);

        return [$orden, $linea, $cliente];
    }

    public function test_venta_a_credito_baja_el_saldo_del_cliente_y_no_saca_dinero_de_la_caja(): void
    {
        [$orden, $linea, $cliente] = $this->ventaACredito(100, 100);
        $this->caja->update([MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::CLOSED]);

        $this->devolver($orden, $linea, 1)
            ->assertStatus(200)
            ->assertJsonPath('data.refund_amount', 100)
            ->assertJsonPath('data.balance_applied', 100)
            ->assertJsonPath('data.refund_payment_method_id', null)
            ->assertJsonPath('data.sistema_id', null);

        $this->assertEquals(0.0, (float) $cliente->fresh()->balance);
    }

    public function test_venta_a_credito_ya_abonada_baja_el_saldo_y_devuelve_el_resto_por_metodo(): void
    {
        // La venta fue de $100 y el cliente ya abonó $60: solo debe $40.
        [$orden, $linea, $cliente] = $this->ventaACredito(100, 40);

        $this->devolver($orden, $linea, 1, ['refund_payment_method_id' => $this->efectivo->id])
            ->assertStatus(200)
            ->assertJsonPath('data.refund_amount', 100)
            ->assertJsonPath('data.balance_applied', 40)
            ->assertJsonPath('data.refund_payment_method_id', $this->efectivo->id);

        $this->assertEquals(0.0, (float) $cliente->fresh()->balance);
        $response = $this->totalesCaja($this->caja)->assertJsonPath('data.bruto', 0);
        $byMethod = $response->json('data.by_payment_method');
        // $60 salen en efectivo; los $40 restantes reducen las ventas a crédito (sin método).
        $this->assertEquals(-60, $this->totalDeMetodo($byMethod, $this->efectivo->id));
        $this->assertEquals(60, $this->totalDeMetodo($byMethod, null));
    }

    public function test_si_el_credito_de_la_venta_nunca_se_cargo_al_cliente_no_baja_su_saldo(): void
    {
        [$orden, $linea, $cliente] = $this->ventaACredito(100, 40);
        DB::table('order')->where('id', $orden->id)->update(['credit_applied_at' => null]);

        $this->devolver($orden, $linea, 1, ['refund_payment_method_id' => $this->efectivo->id])
            ->assertStatus(200)
            ->assertJsonPath('data.balance_applied', 0)
            ->assertJsonPath('data.refund_payment_method_id', $this->efectivo->id);

        $this->assertEquals(40.0, (float) $cliente->fresh()->balance);
    }

    public function test_si_falta_la_caja_el_saldo_del_cliente_no_se_descuenta(): void
    {
        [$orden, $linea, $cliente] = $this->ventaACredito(100, 40);
        $this->caja->update([MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::CLOSED]);

        $this->devolver($orden, $linea, 1, ['refund_payment_method_id' => $this->efectivo->id])->assertStatus(422);

        $this->assertEquals(40.0, (float) $cliente->fresh()->balance);
    }

    public function test_venta_a_credito_con_reembolso_por_metodo_sin_indicarlo_exige_el_metodo(): void
    {
        [$orden, $linea] = $this->ventaACredito(100, 40);

        $this->devolver($orden, $linea, 1)->assertStatus(422)->assertJsonPath('message', 'Selecciona el método con el que se devuelve el dinero.');
    }

    public function test_el_historial_del_cliente_lista_las_devoluciones_que_bajaron_su_saldo(): void
    {
        [$orden, $linea, $cliente] = $this->ventaACredito(100, 100);
        $this->devolver($orden, $linea, 1)->assertStatus(200);
        // Una devolución de una venta normal del mismo cliente no baja su saldo: no aparece.
        [$contado, $lineaContado] = $this->ordenCerrada(50, 1, [OrderModel::CUSTOMER_ID => $cliente->id]);
        $this->devolver($contado, $lineaContado, 1)->assertStatus(200);

        $this->getJson("/api/customer/{$cliente->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonCount(1, 'data.balance_returns')
            ->assertJsonPath('data.balance_returns.0.balance_applied', 100)
            ->assertJsonPath('data.balance_returns.0.order_id', $orden->id);
    }

    public function test_el_historial_no_trae_devoluciones_de_otros_clientes(): void
    {
        [$orden, $linea] = $this->ventaACredito(100, 100);
        $this->devolver($orden, $linea, 1)->assertStatus(200);
        $otro = CustomerModel::create([
            CustomerModel::NAME => 'Otro cliente',
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        $this->getJson("/api/customer/{$otro->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonCount(0, 'data.balance_returns');
    }

    public function test_escenario_credito_devolucion_parcial_liquidacion_y_devolucion_total(): void
    {
        // Venta a crédito de 3 piezas por $300: el cliente debe $300.
        $cliente = CustomerModel::create([
            CustomerModel::NAME => 'Cliente crédito',
            CustomerModel::BALANCE => 300,
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        [$orden, $linea] = $this->ordenCerrada(100, 3, [
            OrderModel::IS_CREDIT => true,
            OrderModel::CUSTOMER_ID => $cliente->id,
            OrderModel::PAYMENT_METHOD_ID => null,
        ]);

        // 1) Devuelve una pieza: baja su adeudo a $200.
        $this->devolver($orden, $linea, 1)->assertStatus(200)->assertJsonPath('data.balance_applied', 100);
        $this->assertEquals(200.0, (float) $cliente->fresh()->balance);

        // 2) Liquida el adeudo: ya no debe nada.
        $this->postJson("/api/customer/{$cliente->id}/payment", ['amount' => 200], $this->authHeaders())->assertStatus(200);
        $this->assertEquals(0.0, (float) $cliente->fresh()->balance);

        // 3) Devuelve lo que queda: el saldo ya no cubre nada, así que el dinero sale por método de pago y
        // el servidor lo exige (rechazado sin método, y sin dejar nada a medias).
        $this->devolver($orden, $linea, 2)
            ->assertStatus(422)
            ->assertJsonPath('message', 'Selecciona el método con el que se devuelve el dinero.');
        $this->assertSame(1, OrderReturnModel::count());

        $this->devolver($orden, $linea, 2, ['refund_payment_method_id' => $this->efectivo->id])
            ->assertStatus(200)
            ->assertJsonPath('data.refund_amount', 200)
            ->assertJsonPath('data.balance_applied', 0)
            ->assertJsonPath('data.refund_payment_method_id', $this->efectivo->id);
        $this->assertEquals(0.0, (float) $cliente->fresh()->balance);
    }

    // ── Plazo y permiso ───────────────────────────────────

    private function usuarioCaja(): User
    {
        $this->otorgarPermiso(RoleEnum::CAJA, 'processReturns');

        return User::factory()->create([User::ROL_ID => RoleEnum::CAJA->value, User::TENANT_ID => BusinessConfigModel::first()->id]);
    }

    public function test_el_plazo_de_devolucion_bloquea_ventas_antiguas_incluso_al_admin(): void
    {
        BusinessConfigModel::first()->update([BusinessConfigModel::RETURN_DAYS => 10]);
        [$orden, $linea] = $this->ordenCerrada(100, 2);
        DB::table('order')->where('id', $orden->id)->update(['closed_at' => now()->subDays(11)]);
        $caja = $this->usuarioCaja();

        $mensaje = ['data' => ['order' => ['El plazo de devolución de 10 días ya venció.']]];
        $this->devolver($orden, $linea, 1, [], $caja)->assertStatus(400)->assertJson($mensaje);
        // Sin excepción para el Admin: para quitar el límite se configura en 0 días.
        $this->devolver($orden, $linea, 1)->assertStatus(400)->assertJson($mensaje);
        $this->assertSame(0, OrderReturnModel::count());
    }

    public function test_el_plazo_por_defecto_es_de_10_dias(): void
    {
        $this->assertSame(10, BusinessConfigModel::first()->return_days);
        [$orden, $linea] = $this->ordenCerrada(100, 3);

        DB::table('order')->where('id', $orden->id)->update(['closed_at' => now()->subDays(9)]);
        $this->devolver($orden, $linea, 1)->assertStatus(200);

        DB::table('order')->where('id', $orden->id)->update(['closed_at' => now()->subDays(11)]);
        $this->devolver($orden, $linea, 1)->assertStatus(400);
    }

    public function test_dentro_del_plazo_o_sin_limite_se_puede_devolver(): void
    {
        [$orden, $linea] = $this->ordenCerrada(100, 3);
        DB::table('order')->where('id', $orden->id)->update(['closed_at' => now()->subDays(5)]);
        $caja = $this->usuarioCaja();

        BusinessConfigModel::first()->update([BusinessConfigModel::RETURN_DAYS => 10]);
        $this->devolver($orden, $linea, 1, [], $caja)->assertStatus(200);

        BusinessConfigModel::first()->update([BusinessConfigModel::RETURN_DAYS => 0]);
        DB::table('order')->where('id', $orden->id)->update(['closed_at' => now()->subYears(2)]);
        $this->devolver($orden, $linea, 1, [], $caja)->assertStatus(200);
    }

    public function test_el_plazo_cuenta_desde_que_se_cerro_la_venta(): void
    {
        $orden = $this->ordenCerrada(100, 1)[0];

        $this->assertNotNull($orden->closed_at);
    }

    public function test_exige_el_permiso_process_returns_no_basta_manage_stock(): void
    {
        [$orden, $linea] = $this->ordenCerrada(100, 2);
        $this->otorgarPermiso(RoleEnum::CAJA, 'manageStock');
        $caja = User::factory()->create([User::ROL_ID => RoleEnum::CAJA->value, User::TENANT_ID => BusinessConfigModel::first()->id]);

        $this->devolver($orden, $linea, 1, [], $caja)->assertStatus(403);

        $this->otorgarPermiso(RoleEnum::CAJA, 'processReturns');
        $this->devolver($orden, $linea, 1, [], $caja)->assertStatus(200);
    }

    public function test_el_detalle_de_la_orden_trae_el_reembolso_con_su_metodo(): void
    {
        [$orden, $linea] = $this->ordenCerrada(100, 2);
        $this->devolver($orden, $linea, 1)->assertStatus(200);

        $this->getJson("/api/order/{$orden->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.order_returns.0.refund_amount', 100)
            ->assertJsonPath('data.order_returns.0.refund_payment_method.name', 'Efectivo');
    }
}
