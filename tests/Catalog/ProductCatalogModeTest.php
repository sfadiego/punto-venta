<?php

namespace Tests\Catalog;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\ProductModel;
use App\Models\User;
use Tests\TestCase;

/**
 * GET /product?catalog=1 (catálogo de venta) devuelve solo las relaciones que pinta la
 * tarjeta; sin el parámetro (administración de productos) conserva todas.
 */
class ProductCatalogModeTest extends TestCase
{
    private function admin(): User
    {
        return User::where('rol_id', RoleEnum::ADMIN->value)->first();
    }

    private function crearProducto(): ProductModel
    {
        return ProductModel::factory()->create([
            ProductModel::TENANT_ID => BusinessConfigModel::first()->id,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
        ]);
    }

    public function test_modo_catalogo_solo_incluye_variantes_y_toppings(): void
    {
        $this->crearProducto();

        $producto = $this->getJson('/api/product?catalog=1', $this->authHeaders($this->admin()))
            ->assertStatus(206)
            ->json('data.0');

        $this->assertArrayHasKey('variants', $producto);
        $this->assertArrayHasKey('addons', $producto);
        $this->assertArrayNotHasKey('category', $producto);
        $this->assertArrayNotHasKey('branches', $producto);
    }

    public function test_sin_modo_catalogo_incluye_todas_las_relaciones(): void
    {
        $this->crearProducto();

        $producto = $this->getJson('/api/product', $this->authHeaders($this->admin()))
            ->assertStatus(206)
            ->json('data.0');

        foreach (['category', 'variants', 'branches', 'addons'] as $relation) {
            $this->assertArrayHasKey($relation, $producto);
        }
    }
}
