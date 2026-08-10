<?php

namespace Tests\Catalog;

use App\Models\BusinessConfigModel;
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

    public function test_filtra_productos_por_nombre_de_categoria(): void
    {
        $tenantId = BusinessConfigModel::first()->id;
        $pizzaCategory = CategoryModel::create([
            CategoryModel::NOMBRE => 'Pizza',
            CategoryModel::TENANT_ID => $tenantId,
        ]);
        $otherCategory = CategoryModel::create([
            CategoryModel::NOMBRE => 'Bebidas',
            CategoryModel::TENANT_ID => $tenantId,
        ]);
        ProductModel::factory()->create(['nombre' => 'Peperoni', 'categoria_id' => $pizzaCategory->id]);
        ProductModel::factory()->create(['nombre' => 'Hawaiana', 'categoria_id' => $pizzaCategory->id]);
        ProductModel::factory()->create(['nombre' => 'Refresco', 'categoria_id' => $otherCategory->id]);

        $response = $this->getJson('/api/product?page=1&limit=10&nombre=Pizza', $this->authHeaders())
            ->assertStatus(206);

        $data = $response->json('data');
        $nombres = array_column($data, 'nombre');
        $this->assertContains('Peperoni', $nombres);
        $this->assertContains('Hawaiana', $nombres);
        $this->assertNotContains('Refresco', $nombres);
    }

    public function test_filtra_productos_por_product_code_exacto(): void
    {
        // El lector de código de barras reutiliza el mismo buscador (?nombre=) — el código
        // hace match exacto, no LIKE parcial, para no traer falsos positivos.
        ProductModel::factory()->create(['nombre' => 'Refresco de cola', 'product_code' => 'ABC12345']);
        ProductModel::factory()->create(['nombre' => 'Otro producto', 'product_code' => 'XYZ99999']);

        $response = $this->getJson('/api/product?page=1&limit=10&nombre=ABC12345', $this->authHeaders())
            ->assertStatus(206);

        $data = $response->json('data');
        $this->assertCount(1, $data);
        $this->assertEquals('ABC12345', $data[0]['product_code']);
    }

    public function test_product_code_parcial_no_hace_match(): void
    {
        ProductModel::factory()->create(['nombre' => 'Refresco de cola', 'product_code' => 'ABC12345']);

        $response = $this->getJson('/api/product?page=1&limit=10&nombre=ABC123', $this->authHeaders())
            ->assertStatus(206);

        $this->assertEmpty($response->json('data'));
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

    // ── Update ───────────────────────────────────────────────

    public function test_actualiza_producto(): void
    {
        $product = ProductModel::factory()->create();

        $this->putJson("/api/product/{$product->id}", [
            'nombre' => 'Producto Actualizado',
            'precio' => 99.50,
            'descripcion' => 'Nueva descripción',
            'categoria_id' => $product->categoria_id,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK')
            ->assertJsonPath('data.nombre', 'Producto Actualizado')
            ->assertJsonPath('data.descripcion', 'Nueva descripción');

        $this->assertDatabaseHas('product', [
            'id' => $product->id,
            'nombre' => 'Producto Actualizado',
            'descripcion' => 'Nueva descripción',
        ]);
    }

    // Regresión: Laravel convierte "" a null vía el middleware global
    // ConvertEmptyStringsToNull antes de llegar al controller. El controller usaba
    // `$param->has('descripcion') ? $param->descripcion : null` para distinguir "campo no
    // enviado" de "no tocar la columna" — pero al vaciar el campo, ambos casos colapsaban en
    // null y la descripción vieja nunca se sobrescribía. Ver ProductController::update().
    public function test_actualiza_producto_permite_vaciar_la_descripcion(): void
    {
        $product = ProductModel::factory()->create(['descripcion' => 'Descripción original']);

        $this->putJson("/api/product/{$product->id}", [
            'nombre' => $product->nombre,
            'precio' => $product->precio,
            'descripcion' => '',
            'categoria_id' => $product->categoria_id,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.descripcion', '');

        $this->assertDatabaseHas('product', [
            'id' => $product->id,
            'descripcion' => '',
        ]);
    }

    public function test_actualiza_producto_sin_descripcion_no_la_modifica(): void
    {
        $product = ProductModel::factory()->create(['descripcion' => 'Descripción que debe permanecer']);

        $this->putJson("/api/product/{$product->id}", [
            'nombre' => $product->nombre,
            'precio' => $product->precio,
            'categoria_id' => $product->categoria_id,
        ], $this->authHeaders())
            ->assertStatus(200);

        $this->assertDatabaseHas('product', [
            'id' => $product->id,
            'descripcion' => 'Descripción que debe permanecer',
        ]);
    }
}
