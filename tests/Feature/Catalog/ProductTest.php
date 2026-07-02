<?php

namespace Tests\Feature\Catalog;

use App\Models\CategoryModel;
use App\Models\ProductModel;
use Tests\TestCase;

class ProductTest extends TestCase
{
    // ── Index ────────────────────────────────────────────────

    public function test_lista_productos_paginada(): void
    {
        $this->getJson('/api/product?page=1&limit=5', $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page']);
    }

    public function test_lista_productos_requiere_autenticacion(): void
    {
        $this->getJson('/api/product?page=1&limit=5')
            ->assertStatus(401);
    }

    public function test_lista_productos_estructura_de_item(): void
    {
        ProductModel::factory()->create();

        $this->getJson('/api/product?page=1&limit=5', $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'nombre', 'precio', 'descripcion', 'activo', 'categoria_id'],
                ],
            ]);
    }

    public function test_filtra_productos_por_nombre(): void
    {
        ProductModel::factory()->create(['nombre' => 'Espresso Filtrado']);
        ProductModel::factory()->create(['nombre' => 'Cappuccino']);

        $response = $this->getJson('/api/product?page=1&limit=10&nombre=Espresso', $this->authHeaders())
            ->assertStatus(206);

        $data = $response->json('data');
        $this->assertNotEmpty($data);
        foreach ($data as $item) {
            $this->assertStringContainsStringIgnoringCase('Espresso', $item['nombre']);
        }
    }

    public function test_filtra_productos_por_categoria(): void
    {
        $category = CategoryModel::first();
        ProductModel::factory()->create(['categoria_id' => $category->id]);

        $response = $this->getJson("/api/product?page=1&limit=10&categoria_id={$category->id}", $this->authHeaders())
            ->assertStatus(206);

        $data = $response->json('data');
        $this->assertNotEmpty($data);
        foreach ($data as $item) {
            $this->assertEquals($category->id, $item['categoria_id']);
        }
    }

    public function test_filtra_por_nombre_inexistente_retorna_vacio(): void
    {
        $response = $this->getJson('/api/product?page=1&limit=5&nombre=xyzinexistente999', $this->authHeaders())
            ->assertStatus(206);

        $this->assertEmpty($response->json('data'));
    }

    public function test_paginacion_respeta_limite(): void
    {
        ProductModel::factory()->count(7)->create();

        $response = $this->getJson('/api/product?page=1&limit=3', $this->authHeaders())
            ->assertStatus(206);

        $this->assertCount(3, $response->json('data'));
        $this->assertEquals(1, $response->json('current_page'));
        $this->assertEquals(3, $response->json('per_page'));
        $this->assertEquals(ProductModel::count(), $response->json('total'));
    }
}
