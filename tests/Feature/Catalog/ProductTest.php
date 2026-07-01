<?php

namespace Tests\Feature\Catalog;

use App\Models\CategoryModel;
use App\Models\ProductModel;
use Tests\TestCase;

class ProductTest extends TestCase
{
    private function createProduct(string $nombre = 'Producto Test'): ProductModel
    {
        return ProductModel::create([
            'nombre' => $nombre,
            'precio' => 35,
            'descripcion' => '',
            'categoria_id' => CategoryModel::first()->id,
        ]);
    }

    // ── Index ────────────────────────────────────────────────

    public function test_lista_productos_paginada(): void
    {
        // successDataTable retorna HTTP 206 (PartialContent)
        $this->getJson('/api/product?page=1&limit=5', $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page']);
    }

    // ── Store ────────────────────────────────────────────────

    public function test_crea_producto(): void
    {
        $response = $this->postJson('/api/product', [
            'nombre' => 'Espresso Test',
            'precio' => 35,
            'categoria_id' => CategoryModel::first()->id,
        ], $this->authHeaders());

        $response->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.nombre', 'Espresso Test');

        $this->assertDatabaseHas('product', ['nombre' => 'Espresso Test']);
    }

    public function test_no_crea_producto_sin_campos_requeridos(): void
    {
        // Campo requerido faltante → ValidationException → 400
        $this->postJson('/api/product', [], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_producto_con_nombre_duplicado(): void
    {
        $existing = $this->createProduct('Producto Duplicado');

        // Violación de unique → ValidationException → 400
        $this->postJson('/api/product', [
            'nombre' => $existing->nombre,
            'precio' => 20,
            'categoria_id' => CategoryModel::first()->id,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_no_crea_producto_con_categoria_inexistente(): void
    {
        // exists:categories,id falla → ValidationException → 400
        $this->postJson('/api/product', [
            'nombre' => 'Producto Sin Categoría',
            'precio' => 20,
            'categoria_id' => 99999,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    // ── Show ─────────────────────────────────────────────────

    public function test_muestra_producto(): void
    {
        $product = $this->createProduct();

        $this->getJson("/api/product/{$product->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.id', $product->id);
    }

    // ── Update ───────────────────────────────────────────────

    public function test_actualiza_producto(): void
    {
        $product = $this->createProduct();
        $categoryId = CategoryModel::first()->id;

        $this->putJson("/api/product/{$product->id}", [
            'nombre' => 'Producto Actualizado',
            'precio' => 50,
            'descripcion' => 'Descripción actualizada',
            'categoria_id' => $categoryId,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertDatabaseHas('product', ['id' => $product->id, 'nombre' => 'Producto Actualizado']);
    }

    // ── Delete ───────────────────────────────────────────────

    public function test_elimina_producto(): void
    {
        $product = $this->createProduct('Para Eliminar');

        $this->deleteJson("/api/product/{$product->id}", [], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertSoftDeleted('product', ['id' => $product->id]);
    }
}
