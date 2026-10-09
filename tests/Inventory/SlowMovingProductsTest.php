<?php

namespace Tests\Inventory;

use App\Enums\BusinessTypeEnum;
use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Enums\StockMovementReasonEnum;
use App\Enums\StockMovementTypeEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use App\Models\RolePermission;
use App\Models\StockMovementModel;
use App\Models\User;
use App\Services\SalesReportExportService;
use App\Services\SlowMovingSectionBuilder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Reporte de productos sin movimiento (GET /api/admin/system/statistics/slow-moving): fecha de
 * referencia = la más reciente entre última venta, último ingreso de stock y alta; solo productos
 * con stock y control de stock; exclusivo de retail con stock activo y permiso viewStatistics.
 */
class SlowMovingProductsTest extends TestCase
{
    private const URL = '/api/admin/system/statistics/slow-moving';

    private MainOrderReportModel $caja;

    protected function setUp(): void
    {
        parent::setUp();

        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value,
            BusinessConfigModel::STOCK_ENABLED => true,
        ]);

        ProductModel::query()->delete();
        $this->caja = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function hace(int $days): Carbon
    {
        return Carbon::today()->subDays($days)->setTime(10, 0);
    }

    /** Producto con stock (por defecto 10 × $50), dado de alta hace $altaHace días. */
    private function crearProducto(string $codigo, int $altaHace = 100, array $overrides = []): ProductModel
    {
        $product = ProductModel::create(array_merge([
            ProductModel::NOMBRE => 'Producto '.$codigo,
            ProductModel::PRECIO => 50,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => true,
            ProductModel::STOCK => 10,
            ProductModel::PRODUCT_CODE => $codigo,
        ], $overrides));
        DB::table('product')->where('id', $product->id)->update(['created_at' => $this->hace($altaHace)]);

        return $product;
    }

    private function venderHace(ProductModel $product, int $days, float $cantidad = 2, OrderStatusEnum $estatus = OrderStatusEnum::CLOSED): void
    {
        $order = OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Venta',
            OrderModel::TOTAL => 100,
            OrderModel::SUBTOTAL => 100,
            OrderModel::DESCUENTO => 0,
            OrderModel::ESTATUS_PEDIDO_ID => $estatus->value,
            OrderModel::SISTEMA_ID => $this->caja->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        DB::table('order')->where('id', $order->id)->update(['created_at' => $this->hace($days)]);

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $order->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::CANTIDAD => $cantidad,
            OrderProductModel::PRECIO => 50,
            OrderProductModel::DESCUENTO => 0,
        ]);
    }

    private function ingresarStockHace(ProductModel $product, int $days): void
    {
        $movement = StockMovementModel::create([
            StockMovementModel::PRODUCT_ID => $product->id,
            StockMovementModel::TYPE => StockMovementTypeEnum::Entry,
            StockMovementModel::QUANTITY => 5,
            StockMovementModel::STOCK_BEFORE => 5,
            StockMovementModel::STOCK_AFTER => 10,
            StockMovementModel::REASON => StockMovementReasonEnum::ManualAdjustment,
            StockMovementModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        DB::table('stock_movements')->where('id', $movement->id)->update(['created_at' => $this->hace($days)]);
    }

    /** @return array<string, array<string, mixed>> filas del listado indexadas por código de producto */
    private function listar(string $query = ''): array
    {
        $response = $this->getJson(self::URL.($query ? "?{$query}" : ''), $this->authHeaders())->assertStatus(206);

        return collect($response->json('data'))->keyBy('product_code')->all();
    }

    // ── Medición ─────────────────────────────────────────────

    public function test_producto_vendido_hace_mas_del_umbral_aparece_con_sus_dias_y_valores(): void
    {
        $this->venderHace($this->crearProducto('VIEJO'), 70, cantidad: 3);

        $row = $this->listar()['VIEJO'];

        $this->assertEquals(70, $row['days_idle']);
        $this->assertSame($this->hace(70)->toDateString(), Carbon::parse($row['last_sale_at'])->toDateString());
        $this->assertEquals(10, $row['stock']);
        $this->assertEquals(500, $row['inventory_value']);
        $this->assertEquals(3, $row['sold_90d']);
    }

    public function test_producto_vendido_recientemente_no_aparece(): void
    {
        $this->venderHace($this->crearProducto('RECIENTE'), 10);

        $this->assertArrayNotHasKey('RECIENTE', $this->listar());
    }

    public function test_producto_nunca_vendido_se_mide_desde_su_alta(): void
    {
        $this->crearProducto('NUNCA', altaHace: 90);

        $row = $this->listar()['NUNCA'];

        $this->assertEquals(90, $row['days_idle']);
        $this->assertNull($row['last_sale_at']);
        $this->assertEquals(0, $row['sold_90d']);
    }

    public function test_un_reabastecimiento_reciente_reinicia_la_cuenta(): void
    {
        $product = $this->crearProducto('SURTIDO', altaHace: 120);
        $this->ingresarStockHace($product, 5);

        $this->assertArrayNotHasKey('SURTIDO', $this->listar());
    }

    public function test_producto_dado_de_alta_hace_poco_no_aparece(): void
    {
        $this->crearProducto('NUEVO', altaHace: 5);

        $this->assertArrayNotHasKey('NUEVO', $this->listar());
    }

    public function test_un_apartado_cuenta_como_movimiento_pero_una_orden_cancelada_no(): void
    {
        $this->venderHace($this->crearProducto('APARTADO', altaHace: 120), 3, estatus: OrderStatusEnum::LAYAWAY);
        $this->venderHace($this->crearProducto('CANCELADA', altaHace: 120), 3, estatus: OrderStatusEnum::CANCELED);

        $rows = $this->listar();

        $this->assertArrayNotHasKey('APARTADO', $rows);
        $this->assertArrayHasKey('CANCELADA', $rows);
    }

    public function test_solo_productos_con_stock_y_control_de_stock_y_no_eliminados(): void
    {
        $this->crearProducto('SINSTOCK', overrides: [ProductModel::STOCK => 0]);
        $this->crearProducto('SINCONTROL', overrides: [ProductModel::MANAGE_STOCK => false, ProductModel::STOCK => null]);
        $this->crearProducto('BORRADO')->delete();
        $this->crearProducto('CONSTOCK');

        $this->assertSame(['CONSTOCK'], array_keys($this->listar()));
    }

    public function test_producto_con_variantes_suma_el_stock_y_valor_de_sus_variantes_activas(): void
    {
        $product = $this->crearProducto('VARIANTES', overrides: [ProductModel::STOCK => null]);
        ProductVariantModel::factory()->create([ProductVariantModel::TENANT_ID => BusinessConfigModel::first()->id, ProductVariantModel::PRODUCT_ID => $product->id, ProductVariantModel::PRECIO => 100, ProductVariantModel::STOCK => 3]);
        ProductVariantModel::factory()->create([ProductVariantModel::TENANT_ID => BusinessConfigModel::first()->id, ProductVariantModel::PRODUCT_ID => $product->id, ProductVariantModel::PRECIO => 20, ProductVariantModel::STOCK => 5]);
        ProductVariantModel::factory()->create([ProductVariantModel::TENANT_ID => BusinessConfigModel::first()->id, ProductVariantModel::PRODUCT_ID => $product->id, ProductVariantModel::PRECIO => 999, ProductVariantModel::STOCK => 9, ProductVariantModel::ACTIVO => false]);

        $row = $this->listar()['VARIANTES'];

        $this->assertEquals(8, $row['stock']);
        $this->assertEquals(400, $row['inventory_value']);
    }

    public function test_umbral_configurable_por_parametro(): void
    {
        $this->venderHace($this->crearProducto('A40'), 40);
        $this->venderHace($this->crearProducto('A100'), 100);

        $this->assertSame(['A100'], array_keys($this->listar()));
        $this->assertEqualsCanonicalizing(['A40', 'A100'], array_keys($this->listar('days=30')));
        $this->assertSame([], $this->listar('days=200'));
    }

    // ── Filtros y orden ──────────────────────────────────────

    public function test_busca_por_nombre_o_codigo_y_filtra_por_categoria(): void
    {
        $juguetes = CategoryModel::create([CategoryModel::NOMBRE => 'Juguetes']);
        $this->crearProducto('CAMION', overrides: [ProductModel::NOMBRE => 'Camión rojo', ProductModel::CATEGORIA_ID => $juguetes->id]);
        $this->crearProducto('GOMITA', overrides: [ProductModel::NOMBRE => 'Gomitas ácidas']);

        $this->assertSame(['CAMION'], array_keys($this->listar('search=Camión')));
        $this->assertSame(['GOMITA'], array_keys($this->listar('search=GOMITA')));
        $this->assertSame(['CAMION'], array_keys($this->listar("categoria_id={$juguetes->id}")));
        $this->assertSame('Juguetes', $this->listar()['CAMION']['categoria']);
    }

    public function test_orden_por_defecto_es_el_mas_antiguo_primero_y_se_puede_invertir(): void
    {
        $this->crearProducto('A70', altaHace: 70);
        $this->crearProducto('A120', altaHace: 120);
        $this->crearProducto('A90', altaHace: 90);

        $porDefecto = collect($this->getJson(self::URL, $this->authHeaders())->json('data'))->pluck('product_code')->all();
        $inverso = collect($this->getJson(self::URL.'?orderParam=days_idle&order=asc', $this->authHeaders())->json('data'))->pluck('product_code')->all();

        $this->assertSame(['A120', 'A90', 'A70'], $porDefecto);
        $this->assertSame(['A70', 'A90', 'A120'], $inverso);
    }

    public function test_ordena_por_valor_estancado(): void
    {
        $this->crearProducto('BARATO', overrides: [ProductModel::PRECIO => 10]);
        $this->crearProducto('CARO', overrides: [ProductModel::PRECIO => 90]);

        $codes = collect($this->getJson(self::URL.'?orderParam=inventory_value&order=desc', $this->authHeaders())->json('data'))->pluck('product_code')->all();

        $this->assertSame(['CARO', 'BARATO'], $codes);
    }

    public function test_columna_de_orden_no_permitida_cae_al_orden_por_defecto_sin_error(): void
    {
        $this->crearProducto('X');

        $this->getJson(self::URL.'?orderParam=tenant_id;drop', $this->authHeaders())->assertStatus(206);
    }

    public function test_dias_invalidos_son_rechazados(): void
    {
        $this->getJson(self::URL.'?days=0', $this->authHeaders())->assertStatus(400);
        $this->getJson(self::URL.'?days=999', $this->authHeaders())->assertStatus(400);
    }

    // ── Resumen ──────────────────────────────────────────────

    public function test_resumen_calcula_estancados_valor_y_porcentaje_del_inventario(): void
    {
        $this->crearProducto('ESTANCADO');                                  // 10 × 50 = 500
        $this->venderHace($this->crearProducto('SANO'), 5);                 // 500, no estancado
        $this->crearProducto('ESTANCADO2', overrides: [ProductModel::STOCK => 4]); // 4 × 50 = 200

        $this->getJson(self::URL.'/summary', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.days', 60)
            ->assertJsonPath('data.as_of', Carbon::today()->toDateString())
            ->assertJsonPath('data.stale_count', 2)
            ->assertJsonPath('data.stale_value', 700)
            ->assertJsonPath('data.inventory_value', 1200)
            ->assertJsonPath('data.stale_value_percent', 58.3);
    }

    public function test_resumen_sin_inventario_devuelve_ceros(): void
    {
        $this->getJson(self::URL.'/summary', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.stale_count', 0)
            ->assertJsonPath('data.stale_value', 0)
            ->assertJsonPath('data.stale_value_percent', 0);
    }

    // ── Aislamiento y autorización ───────────────────────────

    public function test_no_incluye_productos_de_otros_tenants(): void
    {
        $tenantB = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'tenant-b-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Tenant B',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'lifetime',
        ]);
        $this->crearProducto('PROPIO');
        $ajeno = $this->crearProducto('AJENO', overrides: [ProductModel::TENANT_ID => $tenantB->id]);
        DB::table('product')->where('id', $ajeno->id)->update(['tenant_id' => $tenantB->id]);

        $this->assertSame(['PROPIO'], array_keys($this->listar()));
        $this->getJson(self::URL.'/summary', $this->authHeaders())->assertJsonPath('data.stale_count', 1);
    }

    public function test_tenant_que_no_es_retail_o_sin_stock_activo_recibe_403(): void
    {
        BusinessConfigModel::first()->update([BusinessConfigModel::STOCK_ENABLED => false]);
        $this->getJson(self::URL, $this->authHeaders())->assertStatus(403);

        BusinessConfigModel::first()->update([
            BusinessConfigModel::STOCK_ENABLED => true,
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value,
        ]);
        $this->getJson(self::URL, $this->authHeaders())->assertStatus(403);
    }

    public function test_requiere_autenticacion_y_el_permiso_view_statistics(): void
    {
        $this->getJson(self::URL)->assertStatus(401);

        $empleado = User::factory()->create([User::ROL_ID => RoleEnum::EMPLOYE->value, User::TENANT_ID => BusinessConfigModel::first()->id]);
        // Configurado con otro permiso, para no caer en el fallback a DEFAULTS.
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewOrders');
        $this->getJson(self::URL, $this->authHeaders($empleado))->assertStatus(403);
        $this->getJson(self::URL.'/summary', $this->authHeaders($empleado))->assertStatus(403);

        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewStatistics');
        $this->getJson(self::URL, $this->authHeaders($empleado))->assertStatus(206);
    }

    // ── Exportación (CSV) ──────────────────────────

    private function exportar(string $query = '', ?User $user = null)
    {
        return $this->getJson(self::URL.'/export'.$query, $this->authHeaders($user));
    }

    /** @return array<int, array<int, string|null>> filas del CSV (sin BOM), encabezado incluido */
    private function csvRows($response): array
    {
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $response->streamedContent());

        return array_map('str_getcsv', array_filter(explode("\n", $content), fn (string $line): bool => $line !== ''));
    }

    public function test_exporta_el_listado_completo_sin_paginar_en_csv(): void
    {
        for ($i = 1; $i <= 12; $i++) {
            $this->crearProducto(sprintf('P%02d', $i), altaHace: 100 + $i);
        }

        $response = $this->exportar()->assertStatus(200);
        $rows = $this->csvRows($response);

        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $this->assertSame('Código', $rows[0][0]);
        $this->assertSame('Valor estancado', $rows[0][9]);
        // Encabezado + 12 productos, el más antiguo (más días sin movimiento) primero.
        $this->assertCount(13, $rows);
        $this->assertSame('P12', $rows[1][0]);
        $this->assertEquals(112, $rows[1][6]);
    }

    public function test_la_exportacion_respeta_los_filtros_de_dias_y_categoria(): void
    {
        $categoria = CategoryModel::create([CategoryModel::NOMBRE => 'Peluches']);
        $this->crearProducto('VIEJO', altaHace: 200, overrides: [ProductModel::CATEGORIA_ID => $categoria->id]);
        $this->crearProducto('RECIEN', altaHace: 10);
        $this->crearProducto('OTRA', altaHace: 200);

        $response = $this->exportar("?days=60&categoria_id={$categoria->id}")->assertStatus(200);
        $rows = $this->csvRows($response);

        $this->assertCount(2, $rows);
        $this->assertSame('VIEJO', $rows[1][0]);
        $this->assertSame('Peluches', $rows[1][2]);
        $this->assertSame('Nunca', $rows[1][5]);
        $this->assertEquals(200, $rows[1][6]);
        $this->assertEquals(10, $rows[1][7]);
        $this->assertEquals(500, $rows[1][9]);
    }

    public function test_la_exportacion_solo_incluye_productos_del_tenant(): void
    {
        $tenantB = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'tenant-b-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Tenant B',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
            BusinessConfigModel::SUBSCRIPTION_PLAN => 'lifetime',
        ]);
        $this->crearProducto('PROPIO');
        $ajeno = $this->crearProducto('AJENO');
        DB::table('product')->where('id', $ajeno->id)->update(['tenant_id' => $tenantB->id]);

        $rows = $this->csvRows($this->exportar()->assertStatus(200));

        $this->assertSame(['PROPIO'], array_column(array_slice($rows, 1), 0));
    }

    public function test_la_exportacion_rechaza_una_categoria_de_otro_tenant(): void
    {
        $this->exportar('?categoria_id=999999')->assertStatus(400);
    }

    public function test_la_exportacion_respeta_tipo_de_negocio_y_permiso(): void
    {
        $this->getJson(self::URL.'/export')->assertStatus(401);

        BusinessConfigModel::first()->update([BusinessConfigModel::STOCK_ENABLED => false]);
        $this->exportar()->assertStatus(403);
        BusinessConfigModel::first()->update([BusinessConfigModel::STOCK_ENABLED => true]);

        $empleado = User::factory()->create([User::ROL_ID => RoleEnum::EMPLOYE->value, User::TENANT_ID => BusinessConfigModel::first()->id]);
        // Configurado con otro permiso, para no caer en el fallback a DEFAULTS.
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewOrders');
        $this->exportar('', $empleado)->assertStatus(403);

        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewStatistics');
        $this->exportar('', $empleado)->assertStatus(200);
    }

    private function otorgarPermiso(int $roleId, string $key): void
    {
        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => $roleId,
            RolePermission::PERMISSION_ID => Permission::where(Permission::KEY, $key)->firstOrFail()->id,
        ]);
    }

    // ── Sección detallada en el reporte de ventas (PDF) ──────

    private function datosDelReporte(): array
    {
        // Fuera de una request no hay tenant bindeado en el contenedor.
        app()->instance('tenant_id', BusinessConfigModel::first()->id);

        return app(SalesReportExportService::class)->viewData($this->caja->id, null, null, null, false);
    }

    public function test_el_reporte_de_ventas_incluye_el_detalle_completo_de_productos_sin_movimiento(): void
    {
        $juguetes = CategoryModel::create([CategoryModel::NOMBRE => 'Juguetes']);
        $this->venderHace($this->crearProducto('CAMION', overrides: [ProductModel::NOMBRE => 'Camión rojo', ProductModel::CATEGORIA_ID => $juguetes->id]), 70, cantidad: 3);
        $this->venderHace($this->crearProducto('SANO'), 5);

        $html = view('reports.sales-report', $this->datosDelReporte())->render();

        foreach (['Productos sin movimiento', 'Estado al', 'CAMION', 'Camión rojo', 'Juguetes', $this->hace(100)->format('d/m/Y'), $this->hace(70)->format('d/m/Y'), 'Valor estanc.', '$500.00', 'Total listado (1 productos)'] as $expected) {
            $this->assertStringContainsString($expected, $html);
        }
        $this->assertStringNotContainsString('SANO', $html);
    }

    public function test_reporte_sin_productos_estancados_muestra_el_mensaje_vacio(): void
    {
        $this->venderHace($this->crearProducto('SANO'), 5);

        $html = view('reports.sales-report', $this->datosDelReporte())->render();

        $this->assertStringContainsString('Ningún producto lleva 60 días o más sin movimiento', $html);
    }

    public function test_la_seccion_lista_hasta_el_tope_y_resume_el_resto(): void
    {
        for ($i = 1; $i <= SlowMovingSectionBuilder::MAX_ROWS + 2; $i++) {
            $this->crearProducto('P'.$i);
        }

        $section = $this->datosDelReporte()['slowMoving'];

        $this->assertCount(SlowMovingSectionBuilder::MAX_ROWS, $section['products']);
        $this->assertSame(2, $section['hiddenCount']);
    }

    public function test_negocios_que_no_son_retail_o_sin_stock_activo_no_llevan_la_seccion(): void
    {
        $this->crearProducto('VIEJO');

        BusinessConfigModel::first()->update([BusinessConfigModel::STOCK_ENABLED => false]);
        $this->assertNull($this->datosDelReporte()['slowMoving']);

        BusinessConfigModel::first()->update([
            BusinessConfigModel::STOCK_ENABLED => true,
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value,
        ]);
        $html = view('reports.sales-report', $this->datosDelReporte())->render();
        $this->assertStringNotContainsString('Productos sin movimiento', $html);
    }

    public function test_el_endpoint_del_reporte_de_ventas_genera_el_pdf_con_la_seccion(): void
    {
        $this->crearProducto('VIEJO');
        $this->venderHace($this->crearProducto('VENDIDO'), 2);

        $response = $this->get("/api/order/sales-report/export?sistema_id={$this->caja->id}", array_merge($this->authHeaders(), ['Accept' => '*/*']))
            ->assertStatus(200);

        $this->assertStringStartsWith('%PDF', $response->getContent());
    }
}
