<?php

namespace Tests\Inventory;

use App\Enums\BusinessTypeEnum;
use App\Enums\RoleEnum;
use App\Enums\StockMovementReasonEnum;
use App\Enums\StockMovementTypeEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\StockMovementModel;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

/**
 * Fase 4 del plan de importación masiva de productos (CSV) — cubre lo que hasta ahora solo se
 * había verificado a mano vía curl/tinker: autorización de rutas (manageStock + retail.stock),
 * el flujo completo de ProductImportService::preview()/commit() (crear, actualizar por
 * product_code, resolución de categoría con detección de typo, reconciliación de stock por
 * delta) y el manejo híbrido de errores/warnings de cada columna del CSV.
 */
class ProductImportTest extends TestCase
{
    private const HEADER = [
        'codigo', 'nombre', 'precio', 'categoria', 'descripcion',
        'unidad_medida', 'maneja_stock', 'stock', 'stock_minimo', 'activo',
    ];

    private function marcarComoRetailConStock(): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value,
            BusinessConfigModel::STOCK_ENABLED => true,
        ]);
    }

    private function crearUsuario(RoleEnum $rol): User
    {
        return User::factory()->create([
            User::ROL_ID => $rol->value,
            User::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function otorgarPermiso(int $roleId, string $key): void
    {
        $permission = Permission::where(Permission::KEY, $key)->firstOrFail();

        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => $roleId,
            RolePermission::PERMISSION_ID => $permission->id,
        ]);
    }

    private function crearCategoria(string $nombre): CategoryModel
    {
        return CategoryModel::create([CategoryModel::NOMBRE => $nombre]);
    }

    private function crearProducto(array $overrides = []): ProductModel
    {
        return ProductModel::create(array_merge([
            ProductModel::NOMBRE => 'Producto existente',
            ProductModel::PRECIO => 100,
            ProductModel::CATEGORIA_ID => $this->crearCategoria('Ropa')->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => false,
            ProductModel::PRODUCT_CODE => 'EXIST01',
        ], $overrides));
    }

    /** @param array<int, array<string, string>> $rows filas indexadas por nombre de columna de HEADER */
    private function csvFile(array $rows): UploadedFile
    {
        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, self::HEADER);
        foreach ($rows as $row) {
            fputcsv($handle, array_map(fn (string $col) => $row[$col] ?? '', self::HEADER));
        }
        rewind($handle);
        $content = stream_get_contents($handle);
        fclose($handle);

        return UploadedFile::fake()->createWithContent('productos.csv', $content);
    }

    private function fila(array $overrides = []): array
    {
        return array_merge([
            'codigo' => '',
            'nombre' => 'Producto CSV',
            'precio' => '199.00',
            'categoria' => 'Ropa',
            'descripcion' => '',
            'unidad_medida' => 'unidad',
            'maneja_stock' => '',
            'stock' => '',
            'stock_minimo' => '',
            'activo' => '',
        ], $overrides);
    }

    // ── Autorización ──────────────────────────────────────────

    public function test_admin_retail_puede_previsualizar_y_confirmar(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');

        $file = $this->csvFile([$this->fila()]);
        $this->postJson('/api/product/import/preview', ['file' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.to_create', 1);
    }

    public function test_rol_con_manage_stock_puede_importar(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'manageStock');
        $caja = $this->crearUsuario(RoleEnum::CAJA);

        $file = $this->csvFile([$this->fila()]);
        $this->postJson('/api/product/import/preview', ['file' => $file], $this->authHeaders($caja))
            ->assertStatus(200);
    }

    public function test_rol_sin_manage_stock_no_puede_importar(): void
    {
        $this->marcarComoRetailConStock();
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'viewOrders');
        $caja = $this->crearUsuario(RoleEnum::CAJA);

        $file = $this->csvFile([$this->fila()]);
        $this->postJson('/api/product/import/preview', ['file' => $file], $this->authHeaders($caja))
            ->assertStatus(403);
    }

    public function test_negocio_no_retail_no_puede_importar(): void
    {
        // Tipo de negocio por defecto del seeder no es retail — no se llama marcarComoRetailConStock().
        $file = $this->csvFile([$this->fila()]);
        $this->postJson('/api/product/import/preview', ['file' => $file], $this->authHeaders())
            ->assertStatus(403);
    }

    public function test_retail_sin_stock_enabled_no_puede_importar(): void
    {
        BusinessConfigModel::first()->update([
            BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value,
            BusinessConfigModel::STOCK_ENABLED => false,
        ]);

        $file = $this->csvFile([$this->fila()]);
        $this->postJson('/api/product/import/preview', ['file' => $file], $this->authHeaders())
            ->assertStatus(403);
    }

    public function test_sin_autenticacion_no_accede(): void
    {
        $this->marcarComoRetailConStock();
        $file = $this->csvFile([$this->fila()]);
        $this->postJson('/api/product/import/preview', ['file' => $file])->assertStatus(401);
    }

    // ── preview() no escribe nada ─────────────────────────────

    public function test_preview_no_escribe_en_base_de_datos(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');
        $productosAntes = ProductModel::count();
        $categoriasAntes = CategoryModel::count();

        $file = $this->csvFile([$this->fila(['categoria' => 'Categoria Nueva'])]);
        $this->postJson('/api/product/import/preview', ['file' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.rows.0.data.categoria_status', 'new');

        $this->assertSame($productosAntes, ProductModel::count());
        $this->assertSame($categoriasAntes, CategoryModel::count());
    }

    // ── commit() — crear ──────────────────────────────────────

    public function test_commit_crea_producto_nuevo_con_codigo_generado(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');

        $file = $this->csvFile([$this->fila(['nombre' => 'Mochila escolar'])]);
        $response = $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.to_create', 1)
            ->assertJsonPath('data.summary.errors', 0);

        $productId = $response->json('data.rows.0.data.product_id');
        $product = ProductModel::find($productId);
        $this->assertNotNull($product);
        $this->assertSame('Mochila escolar', $product->nombre);
        $this->assertNotEmpty($product->product_code);
    }

    public function test_commit_crea_categoria_nueva_y_la_reutiliza_entre_filas(): void
    {
        $this->marcarComoRetailConStock();
        $categoriasAntes = CategoryModel::count();

        $file = $this->csvFile([
            $this->fila(['nombre' => 'Producto A', 'categoria' => 'Chucherías']),
            $this->fila(['nombre' => 'Producto B', 'categoria' => 'Chucherías']),
        ]);
        $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.to_create', 2);

        // Solo una categoría nueva creada pese a que dos filas la referencian.
        $this->assertSame($categoriasAntes + 1, CategoryModel::count());
        $categoria = CategoryModel::where(CategoryModel::NOMBRE, 'Chucherías')->firstOrFail();
        $this->assertSame(2, ProductModel::where(ProductModel::CATEGORIA_ID, $categoria->id)->count());
    }

    public function test_commit_aplica_stock_inicial_como_movimiento_auditado(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');

        $file = $this->csvFile([$this->fila([
            'nombre' => 'Producto con stock inicial',
            'maneja_stock' => 'si',
            'stock' => '10',
            'stock_minimo' => '3',
        ])]);
        $response = $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200);

        $product = ProductModel::find($response->json('data.rows.0.data.product_id'));
        $this->assertTrue($product->manage_stock);
        $this->assertEquals(10, $product->stock);
        $this->assertEquals(3, $product->min_stock);

        $movement = StockMovementModel::where(StockMovementModel::PRODUCT_ID, $product->id)->firstOrFail();
        $this->assertSame(StockMovementReasonEnum::InitialStock, $movement->reason);
        $this->assertEquals(10, $movement->quantity);
    }

    public function test_commit_sin_stock_inicial_no_genera_movimiento(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');

        $file = $this->csvFile([$this->fila(['maneja_stock' => 'si', 'stock' => '0'])]);
        $response = $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200);

        $productId = $response->json('data.rows.0.data.product_id');
        $this->assertSame(0, StockMovementModel::where(StockMovementModel::PRODUCT_ID, $productId)->count());
    }

    // ── commit() — actualizar por código ──────────────────────

    public function test_commit_actualiza_producto_existente_por_codigo(): void
    {
        $this->marcarComoRetailConStock();
        $categoria = $this->crearCategoria('Zapatos');
        $product = $this->crearProducto(['product_code' => 'T1234', 'precio' => 100]);

        $file = $this->csvFile([$this->fila([
            'codigo' => 'T1234',
            'nombre' => 'Nombre actualizado',
            'precio' => '250.00',
            'categoria' => 'Zapatos',
        ])]);
        $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.to_update', 1);

        $product->refresh();
        $this->assertSame('Nombre actualizado', $product->nombre);
        $this->assertEquals(250, $product->precio);
        $this->assertSame($categoria->id, $product->categoria_id);
    }

    public function test_commit_actualizacion_conserva_manage_stock_si_celda_vacia(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');
        $product = $this->crearProducto([
            'product_code' => 'PRESRV1',
            'manage_stock' => true,
            'stock' => 25,
            'min_stock' => 2,
        ]);

        $file = $this->csvFile([$this->fila([
            'codigo' => 'PRESRV1',
            'precio' => '399.00',
            'maneja_stock' => '',
            'stock' => '',
        ])]);
        $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200);

        $product->refresh();
        $this->assertTrue($product->manage_stock);
        $this->assertEquals(25, $product->stock);
        $this->assertEquals(2, $product->min_stock);
        $this->assertEquals(399, $product->precio);
    }

    public function test_commit_actualizacion_calcula_delta_de_stock_y_lo_audita(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');
        $product = $this->crearProducto([
            'product_code' => 'DELTA01',
            'manage_stock' => true,
            'stock' => 10,
        ]);

        $file = $this->csvFile([$this->fila([
            'codigo' => 'DELTA01',
            'maneja_stock' => 'si',
            'stock' => '15',
        ])]);
        $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200);

        $product->refresh();
        $this->assertEquals(15, $product->stock);

        $movement = StockMovementModel::where(StockMovementModel::PRODUCT_ID, $product->id)->firstOrFail();
        $this->assertSame(StockMovementTypeEnum::Adjustment, $movement->type);
        $this->assertSame(StockMovementReasonEnum::ManualAdjustment, $movement->reason);
        $this->assertEquals(5, $movement->quantity);
        $this->assertEquals(15, $movement->stock_after);
    }

    public function test_commit_actualizacion_sin_cambio_de_stock_no_genera_movimiento(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');
        $product = $this->crearProducto([
            'product_code' => 'NODELTA',
            'manage_stock' => true,
            'stock' => 10,
        ]);

        $file = $this->csvFile([$this->fila([
            'codigo' => 'NODELTA',
            'maneja_stock' => 'si',
            'stock' => '10',
        ])]);
        $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200);

        $this->assertSame(0, StockMovementModel::where(StockMovementModel::PRODUCT_ID, $product->id)->count());
    }

    public function test_commit_actualizacion_renombra_producto_encontrado_por_codigo_aunque_nombre_difiera(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');
        $product = $this->crearProducto(['product_code' => 'RENAME1', 'nombre' => 'Nombre viejo']);

        $file = $this->csvFile([$this->fila(['codigo' => 'RENAME1', 'nombre' => 'Nombre completamente distinto'])]);
        $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.errors', 0);

        $product->refresh();
        $this->assertSame('Nombre completamente distinto', $product->nombre);
    }

    // ── Errores estructurales (bloquean la fila) ──────────────

    public function test_fila_sin_nombre_es_error(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');

        $file = $this->csvFile([$this->fila(['nombre' => ''])]);
        $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.errors', 1)
            ->assertJsonPath('data.summary.to_create', 0);

        $this->assertSame(0, ProductModel::count());
    }

    public function test_fila_sin_categoria_es_error(): void
    {
        $this->marcarComoRetailConStock();

        $file = $this->csvFile([$this->fila(['categoria' => ''])]);
        $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.errors', 1);
    }

    public function test_categoria_con_typo_es_error_y_no_crea_categoria(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Zapatos');
        $categoriasAntes = CategoryModel::count();

        $file = $this->csvFile([$this->fila(['categoria' => 'Zapatoss'])]);
        $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.errors', 1)
            ->assertJsonPath('data.rows.0.action', 'error');

        $this->assertSame($categoriasAntes, CategoryModel::count());
        $this->assertSame(0, ProductModel::count());
    }

    public function test_nombre_duplicado_sin_codigo_es_error(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');
        $this->crearProducto(['nombre' => 'Producto repetido', 'product_code' => 'ORIGINAL']);

        $file = $this->csvFile([$this->fila(['nombre' => 'Producto repetido'])]);
        $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.errors', 1);

        $this->assertSame(1, ProductModel::count());
    }

    // ── Warnings con default seguro (no bloquean la fila) ─────

    public function test_precio_invalido_usa_cero_con_warning(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');

        $file = $this->csvFile([$this->fila(['precio' => 'abc'])]);
        $response = $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.to_create', 1);

        $productId = $response->json('data.rows.0.data.product_id');
        $this->assertEquals(0, ProductModel::find($productId)->precio);
    }

    public function test_unidad_medida_invalida_usa_default_con_warning(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');

        $file = $this->csvFile([$this->fila(['unidad_medida' => 'litros_raros'])]);
        $response = $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.to_create', 1);

        $this->assertGreaterThan(0, count($response->json('data.rows.0.warnings')));
        $productId = $response->json('data.rows.0.data.product_id');
        $this->assertSame('unidad', ProductModel::find($productId)->unidad_medida->value);
    }

    public function test_maneja_stock_ambiguo_usa_default_con_warning_al_crear(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');

        $file = $this->csvFile([$this->fila(['maneja_stock' => 'tal_vez'])]);
        $response = $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200);

        $this->assertGreaterThan(0, count($response->json('data.rows.0.warnings')));
        $productId = $response->json('data.rows.0.data.product_id');
        $this->assertFalse(ProductModel::find($productId)->manage_stock);
    }

    public function test_stock_no_numerico_se_ignora_con_warning(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');

        $file = $this->csvFile([$this->fila(['maneja_stock' => 'si', 'stock' => 'muchos'])]);
        $response = $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200);

        $this->assertGreaterThan(0, count($response->json('data.rows.0.warnings')));
        $productId = $response->json('data.rows.0.data.product_id');
        $this->assertEquals(0, ProductModel::find($productId)->stock);
    }

    public function test_activo_ambiguo_usa_true_por_defecto_con_warning(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');

        $file = $this->csvFile([$this->fila(['activo' => 'quizas'])]);
        $response = $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200);

        $this->assertGreaterThan(0, count($response->json('data.rows.0.warnings')));
        $productId = $response->json('data.rows.0.data.product_id');
        $this->assertTrue((bool) ProductModel::find($productId)->activo);
    }

    public function test_activo_omitido_usa_true_por_defecto_sin_warning(): void
    {
        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');

        $file = $this->csvFile([$this->fila(['activo' => ''])]);
        $response = $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200);

        $this->assertSame([], $response->json('data.rows.0.warnings'));
        $productId = $response->json('data.rows.0.data.product_id');
        $this->assertTrue((bool) ProductModel::find($productId)->activo);
    }

    // ── Aislamiento multi-tenant ───────────────────────────────

    public function test_codigo_de_otro_tenant_no_se_confunde_con_producto_propio(): void
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
        $categoriaB = CategoryModel::create([
            CategoryModel::NOMBRE => 'Categoria tenant B',
            CategoryModel::TENANT_ID => $tenantB->id,
        ]);
        ProductModel::create([
            ProductModel::NOMBRE => 'Producto de otro tenant',
            ProductModel::PRECIO => 50,
            ProductModel::CATEGORIA_ID => $categoriaB->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => false,
            ProductModel::PRODUCT_CODE => 'COMPARTIDO',
            ProductModel::TENANT_ID => $tenantB->id,
        ]);

        $this->marcarComoRetailConStock();
        $this->crearCategoria('Ropa');

        $file = $this->csvFile([$this->fila(['codigo' => 'COMPARTIDO', 'nombre' => 'Producto propio'])]);
        $response = $this->postJson('/api/product/import/commit', ['file' => $file], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.summary.to_create', 1)
            ->assertJsonPath('data.summary.to_update', 0);

        $this->assertSame(
            'Producto propio',
            ProductModel::find($response->json('data.rows.0.data.product_id'))->nombre,
        );
    }

    // ── Plantilla descargable ──────────────────────────────────

    public function test_template_descarga_csv_sin_columna_activo(): void
    {
        $this->marcarComoRetailConStock();

        $response = $this->get('/api/product/import/template', $this->authHeaders())
            ->assertStatus(200);

        $header = strtok((string) $response->streamedContent(), "\n");
        $this->assertStringNotContainsString('activo', $header);
        $this->assertStringContainsString('codigo', $header);
    }
}
