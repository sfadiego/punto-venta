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
use App\Models\PaymentMethodModel;
use App\Models\ProductModel;
use App\Models\User;
use App\Services\SalesReportExportService;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Ventas netas de devoluciones en reportes y estadísticas: lo reembolsado se resta a la venta original
 * (ingresos, ticket promedio, más vendidos, ventas por categoría, crédito de la sesión y reporte PDF).
 * Una devolución solo de stock no anula la venta, y una venta devuelta por completo ya no cuenta.
 */
class OrderReturnNetSalesTest extends TestCase
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

    /** Orden cerrada con una línea de $cantidad piezas a $precio del producto dado (o uno nuevo). */
    private function venta(float $precio, float $cantidad, ?ProductModel $producto = null, array $overrides = []): array
    {
        $producto ??= ProductModel::create([
            ProductModel::NOMBRE => 'Producto '.uniqid(),
            ProductModel::PRECIO => $precio,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => true,
            ProductModel::STOCK => 50,
        ]);

        $total = round($precio * $cantidad, 2);
        $orden = OrderModel::create(array_merge([
            OrderModel::NOMBRE_PEDIDO => 'Venta',
            OrderModel::SISTEMA_ID => $this->caja->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::PAYMENT_METHOD_ID => $this->efectivo->id,
            OrderModel::TOTAL => $total,
            OrderModel::SUBTOTAL => $total,
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
            OrderProductModel::DESCUENTO => 0,
        ]);

        return [$orden, $linea, $producto];
    }

    private function devolver(OrderModel $orden, OrderProductModel $linea, float $cantidad, bool $reembolsar = true)
    {
        return $this->postJson("/api/order/{$orden->id}/return", [
            'reason' => ReturnReasonEnum::NotWanted->value,
            'refund' => $reembolsar,
            'items' => [['order_product_id' => $linea->id, 'quantity' => $cantidad]],
        ], $this->authHeaders())->assertStatus(200);
    }

    private function ticketPromedio()
    {
        return $this->getJson('/api/admin/system/statistics/average-ticket', $this->authHeaders())->assertStatus(200);
    }

    private function ventasPorCategoria()
    {
        return $this->getJson("/api/order/sales-by-category?sistema_id={$this->caja->id}", $this->authHeaders())->assertStatus(200);
    }

    // ── Estadísticas ──────────────────────────────────────

    public function test_ingresos_y_ticket_promedio_restan_lo_reembolsado(): void
    {
        [$a, $lineaA] = $this->venta(100, 2); // $200
        $this->venta(100, 1);                 // $100
        $this->devolver($a, $lineaA, 1);      // -$100

        $this->ticketPromedio()
            ->assertJsonPath('data.total_revenue', 200)
            ->assertJsonPath('data.total_returns', 100)
            ->assertJsonPath('data.orders_count', 2)
            ->assertJsonPath('data.average_ticket', 100);
    }

    public function test_una_venta_devuelta_por_completo_ya_no_cuenta_como_venta(): void
    {
        [$a, $lineaA] = $this->venta(100, 1);
        $this->venta(300, 1);
        $this->devolver($a, $lineaA, 1);

        $this->ticketPromedio()
            ->assertJsonPath('data.total_revenue', 300)
            ->assertJsonPath('data.orders_count', 1)
            ->assertJsonPath('data.average_ticket', 300);
    }

    public function test_una_devolucion_solo_de_stock_no_cambia_las_ventas(): void
    {
        [$a, $lineaA] = $this->venta(100, 2);
        $this->devolver($a, $lineaA, 1, reembolsar: false);

        $this->ticketPromedio()->assertJsonPath('data.total_revenue', 200)->assertJsonPath('data.total_returns', 0);
    }

    public function test_los_mas_vendidos_restan_las_piezas_devueltas_con_reembolso(): void
    {
        [, $linea, $producto] = $this->venta(10, 5);
        $this->venta(10, 4);   // otro producto, 4 piezas
        [$orden, $lineaB, $productoB] = $this->venta(10, 3);
        $this->devolver($orden, $lineaB, 3); // anulada por completo

        $response = $this->getJson('/api/admin/system/statistics/best-seller', $this->authHeaders())->assertStatus(200);
        $top = collect($response->json('data'));

        $this->assertSame($producto->id, $top->first()['id']);
        $this->assertSame(5, $top->first()['total']);
        // El producto devuelto por completo ya no aparece (0 unidades netas).
        $this->assertNull($top->firstWhere('id', $productoB->id));
    }

    public function test_los_mas_vendidos_no_restan_una_devolucion_sin_reembolso(): void
    {
        [$orden, $linea, $producto] = $this->venta(10, 5);
        $this->devolver($orden, $linea, 2, reembolsar: false);

        $top = collect($this->getJson('/api/admin/system/statistics/best-seller', $this->authHeaders())->json('data'));

        $this->assertSame(5, $top->firstWhere('id', $producto->id)['total']);
    }

    // ── Ventas por categoría ──────────────────────────────

    public function test_ventas_por_categoria_restan_ingreso_y_piezas_devueltas(): void
    {
        [$orden, $linea] = $this->venta(100, 3);
        $this->venta(50, 2, ProductModel::first()); // misma categoría
        $this->devolver($orden, $linea, 1);

        $response = $this->ventasPorCategoria()->assertJsonPath('data.returns', 100);
        $categoria = collect($response->json('data.categories'))->first();

        // 3×100 + 2×50 = 400, menos 100 devueltos.
        $this->assertEquals(300, $categoria['total_revenue']);
        $this->assertEquals(4, $categoria['units'][0]['total_cantidad']);
    }

    public function test_ventas_por_categoria_sin_devoluciones_no_cambian(): void
    {
        $this->venta(100, 2);

        $this->ventasPorCategoria()->assertJsonPath('data.returns', 0)->assertJsonPath('data.categories.0.total_revenue', 200);
    }

    // ── Crédito de la sesión ──────────────────────────────

    public function test_credito_de_la_sesion_resta_lo_devuelto(): void
    {
        $cliente = CustomerModel::create([
            CustomerModel::NAME => 'Cliente',
            CustomerModel::BALANCE => 100,
            CustomerModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        [$orden, $linea] = $this->venta(100, 2, null, [
            OrderModel::IS_CREDIT => true,
            OrderModel::CUSTOMER_ID => $cliente->id,
            OrderModel::PAYMENT_METHOD_ID => null,
        ]);
        $this->devolver($orden, $linea, 1);

        $response = $this->getJson("/api/order/credit-customers?sistema_id={$this->caja->id}", $this->authHeaders());

        $this->assertEquals(100, $response->json('data.0.total_credit'));
    }

    // ── Reporte PDF ───────────────────────────────────────

    public function test_el_reporte_de_ventas_muestra_ventas_netas_y_devoluciones(): void
    {
        [$a, $lineaA] = $this->venta(100, 2);
        $this->venta(100, 1);
        [$c, $lineaC] = $this->venta(50, 1);
        $this->devolver($a, $lineaA, 1);
        $this->devolver($c, $lineaC, 1); // venta devuelta por completo

        app()->instance('tenant_id', BusinessConfigModel::first()->id);
        $data = app(SalesReportExportService::class)->viewData($this->caja->id, null, null, null, false);

        $this->assertEquals(150.0, $data['totalReturns']);
        $this->assertEquals(200.0, $data['totalRevenue']);
        $this->assertSame(2, $data['salesCount']);
        $this->assertEquals(100.0, $data['averageSale']);
    }

    public function test_la_plantilla_del_reporte_muestra_las_devoluciones(): void
    {
        [$orden, $linea] = $this->venta(100, 2);
        $this->devolver($orden, $linea, 1);

        app()->instance('tenant_id', BusinessConfigModel::first()->id);
        $service = app(SalesReportExportService::class);
        $html = view('reports.sales-report', $service->viewData($this->caja->id, null, null, null, false))->render();

        $this->assertStringContainsString('Ingreso neto', $html);
        $this->assertStringContainsString('Ventas netas', $html);
        $this->assertStringContainsString('Devuelto -$100.00', $html);
        $this->assertStringStartsWith('%PDF', $service->buildPdf($this->caja->id, null, null, null, false));
    }

    public function test_el_reporte_de_ventas_sin_devoluciones_no_cambia(): void
    {
        $this->venta(100, 2);

        app()->instance('tenant_id', BusinessConfigModel::first()->id);
        $data = app(SalesReportExportService::class)->viewData($this->caja->id, null, null, null, false);

        $this->assertEquals(0.0, $data['totalReturns']);
        $this->assertEquals(200.0, $data['totalRevenue']);
        $this->assertSame(1, $data['salesCount']);
    }
}
