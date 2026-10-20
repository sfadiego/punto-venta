<?php

namespace Tests\Catalog;

use App\Enums\BusinessTypeEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\User;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * Imagen del código de barras de un producto (GET /api/product/{id}/barcode): PNG con las barras
 * Code128 y el código debajo, exclusivo de negocios retail y acotado al tenant. Un producto sin
 * product_code usa su id como código (solo en la imagen).
 */
class ProductBarcodeImageTest extends TestCase
{
    private const PNG_SIGNATURE = "\x89PNG\r\n\x1a\n";

    protected function setUp(): void
    {
        parent::setUp();

        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value]);
        app()->instance('tenant_id', BusinessConfigModel::first()->id);
    }

    private function url(ProductModel $product): string
    {
        return "/api/product/{$product->id}/barcode";
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

    private function descargar(ProductModel $product, ?User $user = null): TestResponse
    {
        return $this->get($this->url($product), array_merge($this->authHeaders($user), ['Accept' => '*/*']));
    }

    // ── Autorización ─────────────────────────────────────────

    public function test_descargar_sin_autenticacion_retorna_401(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'JUG001']);

        $this->getJson($this->url($producto))->assertStatus(401);
    }

    public function test_tenant_que_no_es_retail_no_puede_descargar(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'JUG001']);
        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value]);

        $this->getJson($this->url($producto), $this->authHeaders())->assertStatus(403);
    }

    public function test_rol_con_permiso_de_inventario_puede_descargar(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'JUG001']);
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'manageStock');

        $this->descargar($producto, $empleado)->assertStatus(200);
    }

    public function test_rol_con_permiso_de_productos_puede_descargar(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'JUG001']);
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewProducts');

        $this->descargar($producto, $empleado)->assertStatus(200);
    }

    public function test_rol_configurado_sin_permiso_de_productos_ni_inventario_no_puede_descargar(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'JUG001']);
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        // Configurado con otro permiso, para no caer en el fallback a DEFAULTS (que incluye viewProducts).
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewOrders');

        $this->getJson($this->url($producto), $this->authHeaders($empleado))->assertStatus(403);
    }

    // ── Imagen ───────────────────────────────────────────────

    public function test_descarga_un_png_valido_adjunto(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'JUG001']);

        $response = $this->descargar($producto)->assertStatus(200);

        $this->assertSame('image/png', $response->headers->get('Content-Type'));
        $this->assertSame('attachment; filename="codigo-de-barras-JUG001.png"', $response->headers->get('Content-Disposition'));
        $this->assertStringStartsWith(self::PNG_SIGNATURE, $response->getContent());

        [$width, $height, $type] = getimagesizefromstring($response->getContent());
        $this->assertSame(IMAGETYPE_PNG, $type);
        $this->assertGreaterThan($height, $width);
    }

    public function test_codigo_mas_largo_genera_una_imagen_mas_ancha(): void
    {
        $corto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'AB12']);
        $largo = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'ABCDEFGHIJKL1234567890']);

        $anchoCorto = getimagesizefromstring($this->descargar($corto)->getContent())[0];
        $anchoLargo = getimagesizefromstring($this->descargar($largo)->getContent())[0];

        $this->assertGreaterThan($anchoCorto, $anchoLargo);
    }

    public function test_producto_sin_codigo_usa_su_id_sin_guardarlo(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => null]);

        $response = $this->descargar($producto)->assertStatus(200);

        $this->assertSame("attachment; filename=\"codigo-de-barras-{$producto->id}.png\"", $response->headers->get('Content-Disposition'));
        $this->assertStringStartsWith(self::PNG_SIGNATURE, $response->getContent());
        $this->assertNull($producto->fresh()->product_code);
    }

    public function test_nombre_del_archivo_se_limpia_de_caracteres_no_seguros(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'AB C/12"x']);

        $response = $this->descargar($producto)->assertStatus(200);

        $this->assertSame('attachment; filename="codigo-de-barras-ABC12x.png"', $response->headers->get('Content-Disposition'));
    }

    public function test_codigo_que_no_se_puede_codificar_en_code128_retorna_422(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'CÓDIGO']);

        $this->getJson($this->url($producto), $this->authHeaders())->assertStatus(422);
    }

    // ── Aislamiento ──────────────────────────────────────────

    public function test_producto_de_otro_tenant_retorna_404(): void
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
        $ajeno = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'AJENO', ProductModel::TENANT_ID => $tenantB->id]);

        $this->getJson($this->url($ajeno), $this->authHeaders())->assertStatus(404);
    }

    public function test_producto_eliminado_retorna_404(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'BORRADO']);
        $producto->delete();

        $this->getJson($this->url($producto), $this->authHeaders())->assertStatus(404);
    }
}
