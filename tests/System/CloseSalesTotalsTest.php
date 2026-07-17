<?php

namespace Tests\System;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderStatusModel;
use App\Models\PaymentMethodModel;
use App\Models\ProductModel;
use App\Models\User;
use Tests\TestCase;

/**
 * Verifica los totales del corte de caja:
 *   - bruto   = SUM(order.total) de órdenes Closed de la sesión
 *   - neto    = bruto − domicilios
 *   - propinas = SUM(order.propina) de órdenes Closed
 *   - by_payment_method separa totales y propinas por método
 *
 * El descuento (a nivel orden y producto) ya está aplicado en order.total
 * antes de que llegue al reporte; estos tests verifican esa integración.
 */
class CloseSalesTotalsTest extends TestCase
{
    private function crearCaja(float $inicio = 0): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA         => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => $inicio,
            MainOrderReportModel::USER_ID              => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID            => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearMetodoPago(string $nombre): PaymentMethodModel
    {
        return PaymentMethodModel::create([
            PaymentMethodModel::NAME      => $nombre,
            PaymentMethodModel::ACTIVE    => true,
            PaymentMethodModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearProducto(float $precio = 100): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE       => "Producto $precio",
            ProductModel::PRECIO       => $precio,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO       => true,
        ]);
    }

    /**
     * Crea una orden InProcess, agrega productos vía API y la cierra
     * vía API (PUT estatus=Closed + método de pago + propina opcional).
     * Devuelve el total calculado por el backend.
     */
    private function crearOrdenCerrada(
        int $cajaId,
        array $items,
        int $metodoPagoId,
        float $propina = 0,
        int $descuentoOrden = 0,
        float $costoDomicilio = 0,
    ): OrderModel {
        $orden = OrderModel::create([
            OrderModel::NOMBRE_PEDIDO     => 'Orden Test',
            OrderModel::TOTAL             => 0,
            OrderModel::SUBTOTAL          => 0,
            OrderModel::DESCUENTO         => $descuentoOrden,
            OrderModel::COSTO_DOMICILIO   => $costoDomicilio,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusModel::first()->id,
            OrderModel::SISTEMA_ID        => $cajaId,
            OrderModel::TENANT_ID         => BusinessConfigModel::first()->id,
        ]);

        foreach ($items as $item) {
            $this->postJson("/api/order/{$orden->id}/product", [
                'producto_id' => $item['producto_id'],
                'cantidad'    => $item['cantidad'],
                'precio'      => $item['precio'],
                'descuento'   => $item['descuento'] ?? 0,
            ], $this->authHeaders())->assertStatus(200);
        }

        $this->putJson("/api/order/{$orden->id}", [
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::PAYMENT_METHOD_ID => $metodoPagoId,
            OrderModel::PROPINA           => $propina,
        ], $this->authHeaders())->assertStatus(200);

        return $orden->refresh();
    }

    private function totalesActuales(int $cajaId): array
    {
        return $this->getJson("/api/admin/system/{$cajaId}/total-current-sales", $this->authHeaders())
            ->assertStatus(200)
            ->json('data');
    }

    // ── Estructura de respuesta ───────────────────────────────

    public function test_total_current_sales_retorna_estructura_correcta(): void
    {
        $caja = $this->crearCaja();

        $this->getJson("/api/admin/system/{$caja->id}/total-current-sales", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonStructure([
                'data' => ['bruto', 'domicilios', 'neto', 'propinas', 'by_payment_method'],
            ]);
    }

    public function test_caja_sin_ventas_retorna_ceros(): void
    {
        $caja = $this->crearCaja();

        $totales = $this->totalesActuales($caja->id);

        $this->assertEquals(0.0, $totales['bruto']);
        $this->assertEquals(0.0, $totales['domicilios']);
        $this->assertEquals(0.0, $totales['neto']);
        $this->assertEquals(0.0, $totales['propinas']);
        $this->assertEmpty($totales['by_payment_method']);
    }

    // ── Total bruto y descuentos ──────────────────────────────

    public function test_bruto_suma_totales_de_ordenes_cerradas(): void
    {
        $caja   = $this->crearCaja();
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(100);

        // Orden 1: 100×2 = 200  |  Orden 2: 100×3 = 300  → bruto = 500
        $this->crearOrdenCerrada($caja->id,
            [['producto_id' => $prod->id, 'cantidad' => 2, 'precio' => 100]],
            $metodo->id
        );
        $this->crearOrdenCerrada($caja->id,
            [['producto_id' => $prod->id, 'cantidad' => 3, 'precio' => 100]],
            $metodo->id
        );

        $totales = $this->totalesActuales($caja->id);

        $this->assertEquals(500.0, $totales['bruto']);
    }

    public function test_bruto_aplica_descuento_de_producto(): void
    {
        $caja   = $this->crearCaja();
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(100);

        // precio=100, cantidad=2, descuento producto=25% → total = 100×2×0.75 = 150
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 2, 'precio' => 100, 'descuento' => 25],
        ], $metodo->id);

        $totales = $this->totalesActuales($caja->id);

        $this->assertEquals(150.0, $totales['bruto']);
    }

    public function test_bruto_aplica_descuento_de_orden(): void
    {
        $caja   = $this->crearCaja();
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(100);

        // precio=100, cantidad=4, descuento orden=10% → subtotal=400, total=360
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 4, 'precio' => 100],
        ], $metodo->id, descuentoOrden: 10);

        $totales = $this->totalesActuales($caja->id);

        $this->assertEquals(360.0, $totales['bruto']);
    }

    public function test_bruto_aplica_descuento_producto_y_orden_combinados(): void
    {
        $caja   = $this->crearCaja();
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(200);

        // precio=200, cantidad=2, descuento prod=20%, descuento orden=10%
        // subtotal línea = 200×2×0.80 = 320 → total = 320×0.90 = 288
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 2, 'precio' => 200, 'descuento' => 20],
        ], $metodo->id, descuentoOrden: 10);

        $totales = $this->totalesActuales($caja->id);

        $this->assertEquals(288.0, $totales['bruto']);
    }

    public function test_ordenes_no_cerradas_no_se_cuentan_en_bruto(): void
    {
        $caja   = $this->crearCaja();
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(100);

        // Orden cerrada: 100×2 = 200
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 2, 'precio' => 100],
        ], $metodo->id);

        // Orden en proceso (no cerrada)
        $ordenAbierta = OrderModel::create([
            OrderModel::NOMBRE_PEDIDO     => 'Abierta',
            OrderModel::TOTAL             => 500,
            OrderModel::SUBTOTAL          => 500,
            OrderModel::DESCUENTO         => 0,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            OrderModel::SISTEMA_ID        => $caja->id,
            OrderModel::TENANT_ID         => BusinessConfigModel::first()->id,
        ]);
        $this->assertNotNull($ordenAbierta);

        $totales = $this->totalesActuales($caja->id);

        // Solo la cerrada cuenta: bruto = 200
        $this->assertEquals(200.0, $totales['bruto']);
    }

    // ── Domicilios y neto ─────────────────────────────────────

    public function test_neto_es_bruto_menos_domicilios_negocio_absorbe(): void
    {
        $caja   = $this->crearCaja();
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(100);

        // negocio absorbe: costo_domicilio = -50 → domicilios=50, neto=bruto-50
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 3, 'precio' => 100],
        ], $metodo->id, costoDomicilio: -50);

        $totales = $this->totalesActuales($caja->id);

        $this->assertEquals(300.0, $totales['bruto']);
        $this->assertEquals(50.0,  $totales['domicilios']);
        $this->assertEquals(250.0, $totales['neto']);
    }

    public function test_domicilios_cero_cuando_cliente_paga_por_pos(): void
    {
        $caja   = $this->crearCaja();
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(100);

        // cliente paga por POS: costo_domicilio = +25, NO se cuenta en domicilios del corte
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 2, 'precio' => 100],
        ], $metodo->id, costoDomicilio: 25);

        $totales = $this->totalesActuales($caja->id);

        $this->assertEquals(200.0, $totales['bruto']);
        $this->assertEquals(0.0,   $totales['domicilios']);
        $this->assertEquals(200.0, $totales['neto']);
    }

    public function test_domicilios_sin_envio_retorna_ceros(): void
    {
        $caja   = $this->crearCaja();
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(100);

        // sin domicilio: costo_domicilio = 0
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 2, 'precio' => 100],
        ], $metodo->id, costoDomicilio: 0);

        $totales = $this->totalesActuales($caja->id);

        $this->assertEquals(200.0, $totales['bruto']);
        $this->assertEquals(0.0,   $totales['domicilios']);
        $this->assertEquals(200.0, $totales['neto']);
    }

    public function test_domicilios_solo_cuenta_valores_negativos_en_sesion_mixta(): void
    {
        $caja   = $this->crearCaja();
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(100);

        // Orden 1: negocio absorbe (negativo) → suma a domicilios
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 2, 'precio' => 100],
        ], $metodo->id, costoDomicilio: -30);

        // Orden 2: cliente paga por POS (positivo) → no suma a domicilios
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 3, 'precio' => 100],
        ], $metodo->id, costoDomicilio: 25);

        // Orden 3: negocio absorbe (negativo) → suma a domicilios
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 1, 'precio' => 100],
        ], $metodo->id, costoDomicilio: -20);

        $totales = $this->totalesActuales($caja->id);

        // bruto = 200 + 300 + 100 = 600 (order.total es siempre solo productos)
        $this->assertEquals(600.0, $totales['bruto']);
        // domicilios = ABS(-30) + ABS(-20) = 50 (solo los negativos)
        $this->assertEquals(50.0,  $totales['domicilios']);
        // neto = 600 - 50 = 550
        $this->assertEquals(550.0, $totales['neto']);
    }

    public function test_cierre_caja_efectivo_cierre_resta_domicilios_absorbidos(): void
    {
        $caja   = $this->crearCaja(inicio: 100);
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(100);

        // negocio absorbe: costo_domicilio = -50
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 3, 'precio' => 100],
        ], $metodo->id, costoDomicilio: -50);

        $this->postJson("/api/admin/system/{$caja->id}/close", [], $this->authHeaders())
            ->assertStatus(200);

        $caja->refresh();

        // efectivo_caja_cierre = inicio(100) + bruto(300) - domicilios(50) = 350
        $this->assertEquals(350.0, (float) $caja->efectivo_caja_cierre);
    }

    public function test_cierre_caja_efectivo_no_resta_cuando_cliente_paga_por_pos(): void
    {
        $caja   = $this->crearCaja(inicio: 100);
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(100);

        // cliente paga por POS: costo_domicilio = +25, no afecta domicilios del cierre
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 3, 'precio' => 100],
        ], $metodo->id, costoDomicilio: 25);

        $this->postJson("/api/admin/system/{$caja->id}/close", [], $this->authHeaders())
            ->assertStatus(200);

        $caja->refresh();

        // efectivo_caja_cierre = inicio(100) + bruto(300) - domicilios(0) = 400
        $this->assertEquals(400.0, (float) $caja->efectivo_caja_cierre);
    }

    // ── Propinas ─────────────────────────────────────────────

    public function test_propinas_suma_correctamente(): void
    {
        $caja   = $this->crearCaja();
        $metodo = $this->crearMetodoPago('Transferencia');
        $prod   = $this->crearProducto(100);

        // Orden 1: propina=20  |  Orden 2: propina=30  → total propinas=50
        $this->crearOrdenCerrada($caja->id,
            [['producto_id' => $prod->id, 'cantidad' => 1, 'precio' => 100]],
            $metodo->id, propina: 20
        );
        $this->crearOrdenCerrada($caja->id,
            [['producto_id' => $prod->id, 'cantidad' => 1, 'precio' => 100]],
            $metodo->id, propina: 30
        );

        $totales = $this->totalesActuales($caja->id);

        $this->assertEquals(50.0, $totales['propinas']);
    }

    public function test_propinas_no_inflacion_bruto(): void
    {
        $caja   = $this->crearCaja();
        $metodo = $this->crearMetodoPago('Transferencia');
        $prod   = $this->crearProducto(100);

        // venta = 100, propina = 40 → bruto debe ser 100 (no 140)
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 1, 'precio' => 100],
        ], $metodo->id, propina: 40);

        $totales = $this->totalesActuales($caja->id);

        $this->assertEquals(100.0, $totales['bruto']);
        $this->assertEquals(40.0,  $totales['propinas']);
    }

    public function test_caja_sin_propinas_retorna_cero(): void
    {
        $caja   = $this->crearCaja();
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(100);

        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 2, 'precio' => 100],
        ], $metodo->id, propina: 0);

        $totales = $this->totalesActuales($caja->id);

        $this->assertEquals(0.0, $totales['propinas']);
    }

    // ── Desglose por método de pago ───────────────────────────

    public function test_by_payment_method_separa_efectivo_y_transferencia(): void
    {
        $caja         = $this->crearCaja();
        $efectivo     = $this->crearMetodoPago('Efectivo');
        $transferencia = $this->crearMetodoPago('Transferencia');
        $prod         = $this->crearProducto(100);

        // Efectivo: 100×2 = 200  |  Transferencia: 100×3 = 300
        $this->crearOrdenCerrada($caja->id,
            [['producto_id' => $prod->id, 'cantidad' => 2, 'precio' => 100]],
            $efectivo->id
        );
        $this->crearOrdenCerrada($caja->id,
            [['producto_id' => $prod->id, 'cantidad' => 3, 'precio' => 100]],
            $transferencia->id
        );

        $totales  = $this->totalesActuales($caja->id);
        $metodos  = collect($totales['by_payment_method']);

        $totalEfectivo     = $metodos->firstWhere('payment_method_id', $efectivo->id);
        $totalTransferencia = $metodos->firstWhere('payment_method_id', $transferencia->id);

        $this->assertNotNull($totalEfectivo);
        $this->assertNotNull($totalTransferencia);
        $this->assertEquals(200.0, $totalEfectivo['total']);
        $this->assertEquals(300.0, $totalTransferencia['total']);
    }

    public function test_propinas_desglosadas_por_metodo(): void
    {
        $caja         = $this->crearCaja();
        $efectivo     = $this->crearMetodoPago('Efectivo');
        $transferencia = $this->crearMetodoPago('Transferencia');
        $prod         = $this->crearProducto(100);

        // Propina en efectivo=10, propina en transferencia=25
        $this->crearOrdenCerrada($caja->id,
            [['producto_id' => $prod->id, 'cantidad' => 1, 'precio' => 100]],
            $efectivo->id, propina: 10
        );
        $this->crearOrdenCerrada($caja->id,
            [['producto_id' => $prod->id, 'cantidad' => 1, 'precio' => 100]],
            $transferencia->id, propina: 25
        );

        $totales = $this->totalesActuales($caja->id);
        $metodos = collect($totales['by_payment_method']);

        $propEfectivo     = $metodos->firstWhere('payment_method_id', $efectivo->id)['propina'];
        $propTransferencia = $metodos->firstWhere('payment_method_id', $transferencia->id)['propina'];

        $this->assertEquals(10.0, $propEfectivo);
        $this->assertEquals(25.0, $propTransferencia);
        $this->assertEquals(35.0, $totales['propinas']);
    }

    public function test_by_payment_method_tiene_campo_propina(): void
    {
        $caja   = $this->crearCaja();
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(100);

        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 1, 'precio' => 100],
        ], $metodo->id, propina: 15);

        $totales = $this->totalesActuales($caja->id);
        $entrada = $totales['by_payment_method'][0];

        $this->assertArrayHasKey('propina', $entrada);
        $this->assertEquals(15.0, $entrada['propina']);
    }

    // ── Cierre de caja ────────────────────────────────────────

    public function test_cierre_caja_calcula_venta_dia_correctamente(): void
    {
        $caja   = $this->crearCaja(inicio: 200);
        $metodo = $this->crearMetodoPago('Efectivo');
        $prod   = $this->crearProducto(100);

        // 100×3 = 300 → venta_dia esperada = 300
        $this->crearOrdenCerrada($caja->id, [
            ['producto_id' => $prod->id, 'cantidad' => 3, 'precio' => 100],
        ], $metodo->id);

        $this->postJson("/api/admin/system/{$caja->id}/close", [], $this->authHeaders())
            ->assertStatus(200);

        $caja->refresh();

        $this->assertEquals(300.0, (float) $caja->venta_dia);
        $this->assertEquals(MainOrderStatusEnum::CLOSED->value, $caja->estatus_caja);
    }

    public function test_cierre_caja_bloquea_si_hay_ordenes_activas(): void
    {
        $caja = $this->crearCaja();

        OrderModel::create([
            OrderModel::NOMBRE_PEDIDO     => 'Orden Activa',
            OrderModel::TOTAL             => 100,
            OrderModel::SUBTOTAL          => 100,
            OrderModel::DESCUENTO         => 0,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            OrderModel::SISTEMA_ID        => $caja->id,
            OrderModel::TENANT_ID         => BusinessConfigModel::first()->id,
        ]);

        $this->postJson("/api/admin/system/{$caja->id}/close", [], $this->authHeaders())
            ->assertStatus(422);
    }

    public function test_cierre_caja_bloquea_si_hay_ordenes_servidas(): void
    {
        $caja = $this->crearCaja();

        OrderModel::create([
            OrderModel::NOMBRE_PEDIDO     => 'Orden Servida',
            OrderModel::TOTAL             => 100,
            OrderModel::SUBTOTAL          => 100,
            OrderModel::DESCUENTO         => 0,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::SERVED->value,
            OrderModel::SISTEMA_ID        => $caja->id,
            OrderModel::TENANT_ID         => BusinessConfigModel::first()->id,
        ]);

        $this->postJson("/api/admin/system/{$caja->id}/close", [], $this->authHeaders())
            ->assertStatus(422);
    }
}
