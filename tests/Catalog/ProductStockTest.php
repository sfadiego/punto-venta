<?php

namespace Tests\Catalog;

use App\Enums\StockMovementReasonEnum;
use App\Enums\StockMovementTypeEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\ProductModel;
use App\Models\StockMovementModel;
use Tests\TestCase;

class ProductStockTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Toda esta suite prueba manage_stock — requiere que el tenant tenga
        // business_config.stock_enabled activo (ver ProductStoreRequest/ProductUpdateRequest).
        BusinessConfigModel::first()->update([BusinessConfigModel::STOCK_ENABLED => true]);
    }

    private function basePayload(array $overrides = []): array
    {
        return array_merge([
            'nombre' => 'Refresco de cola',
            'precio' => 20,
            'categoria_id' => CategoryModel::first()->id,
        ], $overrides);
    }

    // ── Store — manage_stock ────────────────────────────────

    public function test_crear_producto_sin_manage_stock_deja_stock_en_null(): void
    {
        $this->postJson('/api/product', $this->basePayload(), $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.manage_stock', false)
            ->assertJsonPath('data.stock', null)
            ->assertJsonPath('data.min_stock', null);
    }

    public function test_crear_producto_con_manage_stock_inicializa_stock_en_cero_por_insert(): void
    {
        $response = $this->postJson('/api/product', $this->basePayload([
            'manage_stock' => true,
        ]), $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.manage_stock', true);

        // El INSERT siempre arranca en 0 — la existencia inicial (si la hay) se aplica
        // después como un movimiento de stock, nunca como valor directo del create().
        $this->assertDatabaseHas('product', [
            'id' => $response->json('data.id'),
            'manage_stock' => true,
            'stock' => 0,
        ]);
    }

    public function test_crear_producto_con_stock_inicial_registra_movimiento_de_carga_inicial(): void
    {
        $response = $this->postJson('/api/product', $this->basePayload([
            'manage_stock' => true,
            'stock' => 100,
            'min_stock' => 10,
        ]), $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.stock', '100.00')
            ->assertJsonPath('data.min_stock', '10.00');

        $productId = $response->json('data.id');

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $productId,
            'type' => StockMovementTypeEnum::Adjustment->value,
            'reason' => StockMovementReasonEnum::InitialStock->value,
            'quantity' => 100,
            'stock_before' => 0,
            'stock_after' => 100,
        ]);
    }

    public function test_crear_producto_con_manage_stock_sin_stock_inicial_no_genera_movimiento(): void
    {
        $response = $this->postJson('/api/product', $this->basePayload([
            'manage_stock' => true,
        ]), $this->authHeaders())->assertStatus(200);

        $this->assertEquals(0, StockMovementModel::where('product_id', $response->json('data.id'))->count());
    }

    public function test_crear_producto_con_manage_stock_sin_min_stock_usa_2_por_defecto(): void
    {
        $response = $this->postJson('/api/product', $this->basePayload([
            'manage_stock' => true,
        ]), $this->authHeaders())->assertStatus(200);

        $this->assertDatabaseHas('product', [
            'id' => $response->json('data.id'),
            'min_stock' => 2,
        ]);
    }

    public function test_crear_producto_con_manage_stock_y_min_stock_explicito_lo_respeta(): void
    {
        $response = $this->postJson('/api/product', $this->basePayload([
            'manage_stock' => true,
            'min_stock' => 8,
        ]), $this->authHeaders())->assertStatus(200);

        $this->assertDatabaseHas('product', [
            'id' => $response->json('data.id'),
            'min_stock' => 8,
        ]);
    }

    public function test_desactivar_manage_stock_en_store_ignora_stock_y_min_stock_enviados(): void
    {
        $response = $this->postJson('/api/product', $this->basePayload([
            'manage_stock' => false,
            'stock' => 50,
            'min_stock' => 5,
        ]), $this->authHeaders())->assertStatus(200);

        $this->assertDatabaseHas('product', [
            'id' => $response->json('data.id'),
            'manage_stock' => false,
            'stock' => null,
            'min_stock' => null,
        ]);
    }

    // ── Store — product_code ────────────────────────────────

    public function test_crear_producto_sin_product_code_lo_genera_automaticamente(): void
    {
        $response = $this->postJson('/api/product', $this->basePayload(), $this->authHeaders())
            ->assertStatus(200);

        $code = $response->json('data.product_code');
        $this->assertNotEmpty($code);
        $this->assertMatchesRegularExpression('/^[A-Z0-9]+$/', $code);
    }

    public function test_crear_producto_con_product_code_manual_lo_respeta(): void
    {
        $this->postJson('/api/product', $this->basePayload([
            'product_code' => 'MICODIGO123',
        ]), $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.product_code', 'MICODIGO123');
    }

    public function test_product_code_duplicado_en_store_falla_validacion(): void
    {
        ProductModel::factory()->create(['product_code' => 'DUPLICADO1']);

        $this->postJson('/api/product', $this->basePayload([
            'product_code' => 'DUPLICADO1',
        ]), $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_product_code_generado_automaticamente_es_unico_aunque_el_nombre_produzca_la_misma_base(): void
    {
        // "Agua Mineral" y "Agua-Mineral!!" colapsan a la misma base ASCII ("AGUAMINE")
        // tras normalizar — el sufijo aleatorio + el chequeo de unicidad deben evitar
        // choque igual. Los nombres deben ser distintos porque "nombre" es único por tenant.
        $first = $this->postJson('/api/product', $this->basePayload(['nombre' => 'Agua Mineral']), $this->authHeaders())
            ->assertStatus(200)->json('data.product_code');

        $second = $this->postJson('/api/product', $this->basePayload(['nombre' => 'Agua-Mineral!!']), $this->authHeaders())
            ->assertStatus(200)->json('data.product_code');

        $this->assertNotEquals($first, $second);
    }

    // ── Update — manage_stock ───────────────────────────────

    public function test_activar_manage_stock_en_update(): void
    {
        $product = ProductModel::factory()->create(['manage_stock' => false, 'stock' => null, 'min_stock' => null]);

        $this->putJson("/api/product/{$product->id}", [
            'nombre' => $product->nombre,
            'precio' => $product->precio,
            'categoria_id' => $product->categoria_id,
            'manage_stock' => true,
            'min_stock' => 5,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.manage_stock', true)
            ->assertJsonPath('data.min_stock', '5.00');
    }

    public function test_activar_manage_stock_en_update_sin_min_stock_usa_2_por_defecto(): void
    {
        $product = ProductModel::factory()->create(['manage_stock' => false, 'stock' => null, 'min_stock' => null]);

        $this->putJson("/api/product/{$product->id}", [
            'nombre' => $product->nombre,
            'precio' => $product->precio,
            'categoria_id' => $product->categoria_id,
            'manage_stock' => true,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.min_stock', '2.00')
            ->assertJsonPath('data.stock', '0.00');
    }

    public function test_desactivar_manage_stock_en_update_limpia_stock_y_min_stock(): void
    {
        $product = ProductModel::factory()->create(['manage_stock' => true, 'stock' => 40, 'min_stock' => 5]);

        $this->putJson("/api/product/{$product->id}", [
            'nombre' => $product->nombre,
            'precio' => $product->precio,
            'categoria_id' => $product->categoria_id,
            'manage_stock' => false,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.manage_stock', false)
            ->assertJsonPath('data.stock', null)
            ->assertJsonPath('data.min_stock', null);

        $this->assertDatabaseHas('product', [
            'id' => $product->id,
            'manage_stock' => false,
            'stock' => null,
            'min_stock' => null,
        ]);
    }

    public function test_update_no_permite_modificar_stock_directamente(): void
    {
        // ProductUpdateRequest no declara regla para "stock" — los cambios de
        // existencia solo pueden pasar por StockService (endpoint de ajuste), nunca
        // por el formulario de edición del producto.
        $product = ProductModel::factory()->create(['manage_stock' => true, 'stock' => 40, 'min_stock' => 5]);

        $this->putJson("/api/product/{$product->id}", [
            'nombre' => $product->nombre,
            'precio' => $product->precio,
            'categoria_id' => $product->categoria_id,
            'stock' => 999,
        ], $this->authHeaders())
            ->assertStatus(200);

        $this->assertDatabaseHas('product', [
            'id' => $product->id,
            'stock' => 40,
        ]);
    }

    // ── Update — product_code ───────────────────────────────

    public function test_actualizar_product_code(): void
    {
        $product = ProductModel::factory()->create(['product_code' => 'VIEJO123']);

        $this->putJson("/api/product/{$product->id}", [
            'nombre' => $product->nombre,
            'precio' => $product->precio,
            'categoria_id' => $product->categoria_id,
            'product_code' => 'NUEVO456',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.product_code', 'NUEVO456');
    }

    public function test_vaciar_product_code_en_update_lo_limpia(): void
    {
        $product = ProductModel::factory()->create(['product_code' => 'ALGO123']);

        $this->putJson("/api/product/{$product->id}", [
            'nombre' => $product->nombre,
            'precio' => $product->precio,
            'categoria_id' => $product->categoria_id,
            'product_code' => '',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.product_code', null);
    }

    public function test_product_code_duplicado_en_update_falla_validacion(): void
    {
        ProductModel::factory()->create(['product_code' => 'OCUPADO1']);
        $product = ProductModel::factory()->create(['product_code' => 'LIBRE1']);

        $this->putJson("/api/product/{$product->id}", [
            'nombre' => $product->nombre,
            'precio' => $product->precio,
            'categoria_id' => $product->categoria_id,
            'product_code' => 'OCUPADO1',
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_product_code_no_cambia_si_no_se_envia_en_update(): void
    {
        $product = ProductModel::factory()->create(['product_code' => 'SINCAMBIO']);

        $this->putJson("/api/product/{$product->id}", [
            'nombre' => 'Nuevo nombre',
            'precio' => $product->precio,
            'categoria_id' => $product->categoria_id,
        ], $this->authHeaders())
            ->assertStatus(200);

        $this->assertDatabaseHas('product', [
            'id' => $product->id,
            'product_code' => 'SINCAMBIO',
        ]);
    }

    // ── Index — filtro low_stock ──────────────────────────────

    public function test_filtro_low_stock_solo_incluye_productos_en_o_bajo_el_minimo(): void
    {
        $bajo = ProductModel::factory()->create([
            'nombre' => 'Bajo stock', 'manage_stock' => true, 'stock' => 3, 'min_stock' => 5,
        ]);
        $enMinimo = ProductModel::factory()->create([
            'nombre' => 'En el minimo', 'manage_stock' => true, 'stock' => 5, 'min_stock' => 5,
        ]);
        $sobrado = ProductModel::factory()->create([
            'nombre' => 'Stock sobrado', 'manage_stock' => true, 'stock' => 20, 'min_stock' => 5,
        ]);

        $response = $this->getJson('/api/product?page=1&limit=10&low_stock=1', $this->authHeaders())
            ->assertStatus(206);

        $ids = array_column($response->json('data'), 'id');
        $this->assertContains($bajo->id, $ids);
        $this->assertContains($enMinimo->id, $ids);
        $this->assertNotContains($sobrado->id, $ids);
    }

    public function test_filtro_low_stock_incluye_stock_en_cero(): void
    {
        $sinExistencia = ProductModel::factory()->create([
            'nombre' => 'Sin existencia', 'manage_stock' => true, 'stock' => 0, 'min_stock' => 2,
        ]);

        $response = $this->getJson('/api/product?page=1&limit=10&low_stock=1', $this->authHeaders())
            ->assertStatus(206);

        $this->assertContains($sinExistencia->id, array_column($response->json('data'), 'id'));
    }

    public function test_filtro_low_stock_excluye_productos_sin_manage_stock(): void
    {
        ProductModel::factory()->create(['nombre' => 'Sin control de stock', 'manage_stock' => false]);

        $response = $this->getJson('/api/product?page=1&limit=10&low_stock=1', $this->authHeaders())
            ->assertStatus(206);

        $this->assertEmpty($response->json('data'));
    }

    public function test_sin_filtro_low_stock_muestra_todos_los_productos(): void
    {
        ProductModel::factory()->create([
            'nombre' => 'Stock sobrado', 'manage_stock' => true, 'stock' => 20, 'min_stock' => 5,
        ]);

        $response = $this->getJson('/api/product?page=1&limit=10', $this->authHeaders())
            ->assertStatus(206);

        $this->assertNotEmpty($response->json('data'));
    }
}
