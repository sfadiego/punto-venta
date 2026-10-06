<?php

namespace Tests\Catalog;

use App\Enums\BusinessTypeEnum;
use App\Enums\RoleEnum;
use App\Enums\UnidadMedidaEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\User;
use Tests\TestCase;

/**
 * Exportación del catálogo (GET /api/product/export): reporte CSV informativo (sin unidad de
 * medida ni maneja_stock), exclusivo de negocios retail y acotado al tenant.
 */
class ProductExportTest extends TestCase
{
    private const BOM = "\xEF\xBB\xBF";

    protected function setUp(): void
    {
        parent::setUp();

        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value]);
    }

    private function crearProducto(array $overrides = []): ProductModel
    {
        return ProductModel::create(array_merge([
            ProductModel::NOMBRE => 'Juguete grande',
            ProductModel::PRECIO => 199,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => false,
            ProductModel::PRODUCT_CODE => 'JUG001',
        ], $overrides));
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
        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => $roleId,
            RolePermission::PERMISSION_ID => Permission::where(Permission::KEY, $key)->firstOrFail()->id,
        ]);
    }

    /** @return array<int, array<int, string>> filas del CSV (sin BOM), encabezado incluido */
    private function exportar(?User $user = null): array
    {
        $response = $this->get('/api/product/export', array_merge($this->authHeaders($user), ['Accept' => '*/*']))
            ->assertStatus(200);

        $content = $response->streamedContent();
        $this->assertStringStartsWith(self::BOM, $content);

        $handle = fopen('php://temp', 'r+');
        fwrite($handle, substr($content, strlen(self::BOM)));
        rewind($handle);
        $rows = [];
        while (($line = fgetcsv($handle)) !== false) {
            $rows[] = $line;
        }
        fclose($handle);

        return $rows;
    }

    // ── Autorización ─────────────────────────────────────────

    public function test_exportar_sin_autenticacion_retorna_401(): void
    {
        $this->getJson('/api/product/export')->assertStatus(401);
    }

    public function test_tenant_que_no_es_retail_no_puede_exportar(): void
    {
        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value]);

        $this->getJson('/api/product/export', $this->authHeaders())->assertStatus(403);
    }

    public function test_rol_con_permiso_de_productos_o_inventario_puede_exportar(): void
    {
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'manageStock');

        $this->assertNotEmpty($this->exportar($empleado));
    }

    public function test_rol_configurado_sin_permiso_de_productos_ni_inventario_no_puede_exportar(): void
    {
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        // Configurado con otro permiso, para no caer en el fallback a DEFAULTS (que incluye viewProducts).
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewOrders');

        $this->getJson('/api/product/export', $this->authHeaders($empleado))->assertStatus(403);
    }

    // ── Contenido ────────────────────────────────────────────

    public function test_csv_solo_trae_las_columnas_informativas(): void
    {
        $rows = $this->exportar();

        $this->assertSame(
            ['codigo', 'nombre', 'precio', 'categoria', 'descripcion', 'stock', 'stock_minimo', 'activo'],
            $rows[0]
        );
        $this->assertNotContains('unidad_medida', $rows[0]);
        $this->assertNotContains('maneja_stock', $rows[0]);
    }

    public function test_csv_incluye_los_datos_del_producto_en_el_orden_de_las_columnas(): void
    {
        ProductModel::query()->delete();
        $categoria = CategoryModel::create([CategoryModel::NOMBRE => 'Juguetes']);
        $this->crearProducto([
            ProductModel::CATEGORIA_ID => $categoria->id,
            ProductModel::DESCRIPCION => 'Camión de 40 cm',
            ProductModel::MANAGE_STOCK => true,
            ProductModel::STOCK => 12,
            ProductModel::MIN_STOCK => 2,
            ProductModel::UNIDAD_MEDIDA => UnidadMedidaEnum::Unidad,
        ]);

        $rows = $this->exportar();

        $this->assertCount(2, $rows);
        $this->assertSame(
            ['JUG001', 'Juguete grande', '199.00', 'Juguetes', 'Camión de 40 cm', '12', '2', 'si'],
            $rows[1]
        );
    }

    public function test_producto_sin_manejo_de_stock_exporta_stock_vacio_y_los_inactivos_tambien_salen(): void
    {
        ProductModel::query()->delete();
        $this->crearProducto([ProductModel::ACTIVO => false]);

        $rows = $this->exportar();

        $this->assertSame(['JUG001', 'Juguete grande', '199.00'], array_slice($rows[1], 0, 3));
        $this->assertSame(['', '', 'no'], array_slice($rows[1], 5));
    }

    public function test_productos_eliminados_no_se_exportan(): void
    {
        ProductModel::query()->delete();
        $this->crearProducto(['product_code' => 'VIVO'])->save();
        $this->crearProducto(['product_code' => 'BORRADO'])->delete();

        $codes = array_column($this->exportar(), 0);

        $this->assertContains('VIVO', $codes);
        $this->assertNotContains('BORRADO', $codes);
    }

    public function test_solo_exporta_productos_del_tenant_actual(): void
    {
        ProductModel::query()->delete();
        $this->crearProducto(['product_code' => 'PROPIO']);
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
        $this->crearProducto([ProductModel::PRODUCT_CODE => 'AJENO', ProductModel::TENANT_ID => $tenantB->id]);

        $codes = array_column($this->exportar(), 0);

        $this->assertContains('PROPIO', $codes);
        $this->assertNotContains('AJENO', $codes);
    }

    public function test_texto_que_empieza_como_formula_se_neutraliza(): void
    {
        ProductModel::query()->delete();
        $this->crearProducto([ProductModel::NOMBRE => '=SUM(A1:A9)']);

        $this->assertSame("'=SUM(A1:A9)", $this->exportar()[1][1]);
    }
}
