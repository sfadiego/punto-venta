<?php

namespace Tests\Catalog;

use App\Enums\BusinessTypeEnum;
use App\Models\BusinessConfigModel;
use App\Models\ProductModel;
use Tests\TestCase;

/**
 * Límites de descarga del catálogo en PDF (5/min) y de la imagen por producto (30/min): cada uno
 * lleva su propio contador. Sin prefijo, `throttle:N,M` comparte un contador por usuario entre
 * todas las rutas (la clave no incluye la ruta) y las imágenes gastaban el límite del catálogo.
 * Solo esa dirección es observable: con límites de 5 y 30, el catálogo nunca llega a gastar el de las imágenes.
 */
class ProductBarcodeThrottleTest extends TestCase
{
    private const CATALOG_URL = '/api/product/barcode-catalog';

    private const CATALOG_LIMIT = 5;

    private const IMAGE_LIMIT = 30;

    private ProductModel $producto;

    /** @var array<string, string> */
    private array $headers;

    protected function setUp(): void
    {
        parent::setUp();

        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::Retail->value]);
        app()->instance('tenant_id', BusinessConfigModel::first()->id);
        $this->producto = ProductModel::factory()->create([ProductModel::PRODUCT_CODE => 'JUG001']);
        $this->headers = array_merge($this->authHeaders(), ['Accept' => '*/*']);
    }

    private function descargarCatalogo(int $times): void
    {
        for ($i = 0; $i < $times; $i++) {
            $this->get(self::CATALOG_URL, $this->headers)->assertStatus(200);
        }
    }

    private function descargarImagen(int $times): void
    {
        for ($i = 0; $i < $times; $i++) {
            $this->get("/api/product/{$this->producto->id}/barcode", $this->headers)->assertStatus(200);
        }
    }

    public function test_catalogo_se_limita_a_cinco_descargas_por_minuto(): void
    {
        $this->descargarCatalogo(self::CATALOG_LIMIT);

        $this->get(self::CATALOG_URL, $this->headers)->assertStatus(429);
    }

    public function test_imagen_se_limita_a_treinta_descargas_por_minuto(): void
    {
        $this->descargarImagen(self::IMAGE_LIMIT);

        $this->get("/api/product/{$this->producto->id}/barcode", $this->headers)->assertStatus(429);
    }

    public function test_descargar_imagenes_no_gasta_el_limite_del_catalogo(): void
    {
        $this->descargarImagen(self::CATALOG_LIMIT);

        $this->get(self::CATALOG_URL, $this->headers)->assertStatus(200);
    }
}
