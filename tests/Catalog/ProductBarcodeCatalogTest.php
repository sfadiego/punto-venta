<?php

namespace Tests\Catalog;

use App\Enums\BusinessTypeEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\User;
use App\Services\ProductBarcodeCatalogService;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

/**
 * Catálogo de códigos de barras (GET /api/product/barcode-catalog): PDF con el Code128 de cada
 * producto, exclusivo de negocios retail y acotado al tenant. Un producto sin product_code usa su
 * id como código (solo en el PDF).
 */
class ProductBarcodeCatalogTest extends TestCase
{
    private const URL = '/api/product/barcode-catalog';

    protected function setUp(): void
    {
        parent::setUp();

        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value]);
        // Estos tests solo miran los productos que ellos crean, no los del seeder.
        ProductModel::query()->delete();
        app()->instance('tenant_id', BusinessConfigModel::first()->id);
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

    private function descargar(?User $user = null): TestResponse
    {
        return $this->get(self::URL, array_merge($this->authHeaders($user), ['Accept' => '*/*']));
    }

    /** @return array<int, array{code: string, name: string, price: float, category: string}> */
    private function filas(): array
    {
        return iterator_to_array(app(ProductBarcodeCatalogService::class)->rows(), false);
    }

    // ── Autorización ─────────────────────────────────────────

    public function test_descargar_sin_autenticacion_retorna_401(): void
    {
        $this->getJson(self::URL)->assertStatus(401);
    }

    public function test_tenant_que_no_es_retail_no_puede_descargar(): void
    {
        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Restaurante->value]);

        $this->getJson(self::URL, $this->authHeaders())->assertStatus(403);
    }

    public function test_rol_con_permiso_de_inventario_puede_descargar(): void
    {
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'manageStock');

        $this->descargar($empleado)->assertStatus(200);
    }

    public function test_rol_con_permiso_de_productos_puede_descargar(): void
    {
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewProducts');

        $this->descargar($empleado)->assertStatus(200);
    }

    public function test_rol_configurado_sin_permiso_de_productos_ni_inventario_no_puede_descargar(): void
    {
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        // Configurado con otro permiso, para no caer en el fallback a DEFAULTS (que incluye viewProducts).
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewOrders');

        $this->getJson(self::URL, $this->authHeaders($empleado))->assertStatus(403);
    }

    // ── PDF ──────────────────────────────────────────────────

    public function test_descarga_un_pdf_adjunto(): void
    {
        ProductModel::factory()->create([ProductModel::NOMBRE => 'Juguete', ProductModel::PRODUCT_CODE => 'JUG001']);

        $response = $this->descargar()->assertStatus(200);

        $this->assertSame('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment; filename="catalogo-codigos-de-barras-', $response->headers->get('Content-Disposition'));
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_catalogo_vacio_genera_un_pdf_valido(): void
    {
        $response = $this->descargar()->assertStatus(200);

        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_nombres_con_acentos_enie_y_emojis_no_rompen_el_pdf(): void
    {
        ProductModel::factory()->create([ProductModel::NOMBRE => 'Piñata Ñandú acentuación 🎉', ProductModel::PRODUCT_CODE => 'PIN001']);

        $response = $this->descargar()->assertStatus(200);

        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_codigo_que_no_se_puede_codificar_en_code128_sale_con_aviso_y_sin_barras(): void
    {
        ProductModel::factory()->create([ProductModel::NOMBRE => 'Caramelo', ProductModel::PRODUCT_CODE => 'CÓDIGO']);

        $response = $this->descargar()->assertStatus(200);

        $this->assertStringStartsWith('%PDF', $response->getContent());
        $this->assertSame(['CÓDIGO'], array_column($this->filas(), 'code'));

        $contenido = $this->contenidoDelPdf($response->getContent());
        $this->assertStringContainsString($this->aviso(), $contenido);
        // Sin barras falsas: una fila con barras dibuja rectángulos rellenos ("re f").
        $this->assertStringNotContainsString(' re f', $contenido);
    }

    public function test_codigo_valido_se_dibuja_con_barras_y_sin_aviso(): void
    {
        ProductModel::factory()->create([ProductModel::NOMBRE => 'Caramelo', ProductModel::PRODUCT_CODE => 'CAR001']);

        $contenido = $this->contenidoDelPdf($this->descargar()->assertStatus(200)->getContent());

        $this->assertStringContainsString(' re f', $contenido);
        $this->assertStringNotContainsString($this->aviso(), $contenido);
    }

    public function test_catalogo_con_mas_filas_que_el_tope_se_rechaza(): void
    {
        $this->mock(ProductBarcodeCatalogService::class, function ($mock) {
            $mock->shouldReceive('exceedsRowLimit')->once()->andReturn(true);
            $mock->shouldReceive('buildPdf')->never();
        });

        $this->descargar()->assertStatus(422);
    }

    // ── Opción include_barcode ───────────────────────────────

    /** Texto de los streams del PDF ya descomprimidos (FPDF los comprime con zlib). */
    private function contenidoDelPdf(string $pdf): string
    {
        preg_match_all('/stream\r?\n(.*?)\r?\nendstream/s', $pdf, $streams);

        return implode("\n", array_map(fn (string $stream): string => (string) gzuncompress($stream), $streams[1]));
    }

    /** El aviso que reemplaza a las barras, en Windows-1252 como lo escribe FPDF. */
    private function aviso(): string
    {
        return mb_convert_encoding('Código no válido para Code128', 'Windows-1252', 'UTF-8');
    }

    private function paginas(string $pdf): int
    {
        return preg_match_all('#/Type /Page(?!s)#', $pdf);
    }

    public function test_sin_parametro_incluye_el_codigo_de_barras(): void
    {
        ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'JUG001']);

        $response = $this->descargar()->assertStatus(200);

        $this->assertStringContainsString('catalogo-codigos-de-barras-', $response->headers->get('Content-Disposition'));
    }

    public function test_include_barcode_en_uno_incluye_el_codigo_de_barras(): void
    {
        ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'JUG001']);

        $response = $this->get(self::URL.'?include_barcode=1', array_merge($this->authHeaders(), ['Accept' => '*/*']))
            ->assertStatus(200);

        $this->assertStringContainsString('catalogo-codigos-de-barras-', $response->headers->get('Content-Disposition'));
    }

    public function test_include_barcode_en_cero_descarga_la_lista_simple(): void
    {
        ProductModel::factory()->create([ProductModel::NOMBRE => 'Piñata', ProductModel::PRODUCT_CODE => 'CÓDIGO']);

        $response = $this->get(self::URL.'?include_barcode=0', array_merge($this->authHeaders(), ['Accept' => '*/*']))
            ->assertStatus(200);

        $this->assertSame('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('catalogo-productos-', $response->headers->get('Content-Disposition'));
        $this->assertStringNotContainsString('codigos-de-barras', $response->headers->get('Content-Disposition'));
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }

    public function test_lista_simple_cabe_en_menos_paginas_que_el_catalogo_con_barras(): void
    {
        ProductModel::factory()->count(25)->create();
        $service = app(ProductBarcodeCatalogService::class);

        // 22 filas por página con barras, 30 en la lista simple.
        $this->assertSame(2, $this->paginas($service->buildPdf(true)));
        $this->assertSame(1, $this->paginas($service->buildPdf(false)));
    }

    public function test_catalogo_vacio_sin_barras_genera_un_pdf_valido(): void
    {
        $pdf = app(ProductBarcodeCatalogService::class)->buildPdf(false);

        $this->assertStringStartsWith('%PDF', $pdf);
        $this->assertSame(1, $this->paginas($pdf));
    }

    public function test_valor_invalido_de_include_barcode_retorna_400_con_el_error_del_campo(): void
    {
        // El proyecto responde 400 {success:false, data:{campo:[mensaje]}} a los errores de validación.
        $this->getJson(self::URL.'?include_barcode=quizas', $this->authHeaders())
            ->assertStatus(400)
            ->assertJsonPath('data.include_barcode.0', 'La opción de incluir el código de barras no es válida.');
    }

    public function test_include_barcode_vacio_se_trata_como_incluir_el_codigo_de_barras(): void
    {
        ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'JUG001']);

        $response = $this->get(self::URL.'?include_barcode=', array_merge($this->authHeaders(), ['Accept' => '*/*']))
            ->assertStatus(200);

        $this->assertStringContainsString('catalogo-codigos-de-barras-', $response->headers->get('Content-Disposition'));
    }

    // ── Filas del catálogo ───────────────────────────────────

    public function test_producto_sin_codigo_usa_su_id_como_codigo_sin_guardarlo(): void
    {
        $producto = ProductModel::factory()->create([ProductModel::NOMBRE => 'Sin codigo', ProductModel::PRODUCT_CODE => null]);

        $this->assertSame([(string) $producto->id], array_column($this->filas(), 'code'));
        $this->assertNull($producto->fresh()->product_code);
    }

    public function test_cada_fila_trae_solo_codigo_nombre_precio_y_categoria(): void
    {
        $categoria = CategoryModel::create([CategoryModel::NOMBRE => 'Juguetes']);
        ProductModel::factory()->create([
            ProductModel::NOMBRE => 'Camión',
            ProductModel::PRECIO => 199.5,
            ProductModel::CATEGORIA_ID => $categoria->id,
            ProductModel::PRODUCT_CODE => 'JUG001',
        ]);

        $this->assertSame(
            [['code' => 'JUG001', 'name' => 'Camión', 'price' => 199.5, 'category' => 'Juguetes']],
            $this->filas()
        );
    }

    public function test_producto_con_categoria_eliminada_sale_con_categoria_vacia(): void
    {
        $categoria = CategoryModel::create([CategoryModel::NOMBRE => 'Temporal']);
        ProductModel::factory()->create([ProductModel::CATEGORIA_ID => $categoria->id, ProductModel::PRODUCT_CODE => 'TMP001']);
        $categoria->delete();

        $this->assertSame([''], array_column($this->filas(), 'category'));
    }

    public function test_producto_con_codigo_usa_su_codigo(): void
    {
        ProductModel::factory()->create([ProductModel::NOMBRE => 'Con codigo', ProductModel::PRODUCT_CODE => 'JUG001']);

        $this->assertSame(['JUG001'], array_column($this->filas(), 'code'));
    }

    public function test_filas_van_ordenadas_por_nombre_e_incluyen_inactivos(): void
    {
        ProductModel::factory()->create([ProductModel::NOMBRE => 'Zapato', ProductModel::PRODUCT_CODE => 'ZAP']);
        ProductModel::factory()->create([ProductModel::NOMBRE => 'Auto', ProductModel::PRODUCT_CODE => 'AUT', ProductModel::ACTIVO => false]);

        $this->assertSame(['Auto', 'Zapato'], array_column($this->filas(), 'name'));
    }

    public function test_productos_eliminados_no_aparecen(): void
    {
        ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'VIVO']);
        ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'BORRADO'])->delete();

        $this->assertSame(['VIVO'], array_column($this->filas(), 'code'));
    }

    public function test_solo_incluye_productos_del_tenant_actual(): void
    {
        ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'PROPIO']);
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
        ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'AJENO', ProductModel::TENANT_ID => $tenantB->id]);

        $this->assertSame(['PROPIO'], array_column($this->filas(), 'code'));
    }
}
