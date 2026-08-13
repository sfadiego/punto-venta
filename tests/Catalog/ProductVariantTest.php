<?php

namespace Tests\Catalog;

use App\Enums\BusinessTypeEnum;
use App\Enums\UnidadMedidaEnum;
use App\Models\BusinessConfigModel;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use Tests\TestCase;

class ProductVariantTest extends TestCase
{
    private function crearProducto(array $overrides = []): ProductModel
    {
        return ProductModel::factory()->create([
            'tenant_id' => BusinessConfigModel::first()->id,
            ...$overrides,
        ]);
    }

    private function crearVariante(ProductModel $product): ProductVariantModel
    {
        return ProductVariantModel::factory()->create([
            ProductVariantModel::PRODUCT_ID => $product->id,
            'tenant_id' => BusinessConfigModel::first()->id,
        ]);
    }

    public function test_no_lista_variantes_sin_autenticacion(): void
    {
        $product = $this->crearProducto();

        $this->getJson("/api/product/{$product->id}/variant")
            ->assertStatus(401);
    }

    public function test_crea_variante(): void
    {
        $product = $this->crearProducto();

        $this->postJson(
            "/api/product/{$product->id}/variant",
            ['nombre' => 'Chica', 'precio' => 80],
            $this->authHeaders()
        )->assertStatus(200)
            ->assertJsonPath('data.nombre', 'Chica')
            ->assertJsonPath('data.precio', 80);

        $this->assertDatabaseHas('product_variants', [
            'product_id' => $product->id,
            'nombre' => 'Chica',
        ]);
    }

    public function test_no_crea_variante_sin_nombre_o_precio(): void
    {
        $product = $this->crearProducto();

        $this->postJson(
            "/api/product/{$product->id}/variant",
            [],
            $this->authHeaders()
        )->assertStatus(400);
    }

    public function test_lista_variantes_de_un_producto(): void
    {
        $product = $this->crearProducto();
        $this->crearVariante($product);
        $this->crearVariante($product);

        $this->getJson(
            "/api/product/{$product->id}/variant",
            $this->authHeaders()
        )->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_actualiza_variante(): void
    {
        $product = $this->crearProducto();
        $variant = $this->crearVariante($product);

        $this->putJson(
            "/api/product/{$product->id}/variant/{$variant->id}",
            ['precio' => 150],
            $this->authHeaders()
        )->assertStatus(200)
            ->assertJsonPath('data.precio', 150);
    }

    public function test_elimina_variante(): void
    {
        $product = $this->crearProducto();
        $variant = $this->crearVariante($product);

        $this->deleteJson(
            "/api/product/{$product->id}/variant/{$variant->id}",
            [],
            $this->authHeaders()
        )->assertStatus(200);

        $this->assertDatabaseMissing('product_variants', ['id' => $variant->id]);
    }

    public function test_no_actualiza_variante_de_otro_producto(): void
    {
        $product = $this->crearProducto();
        $otherProduct = $this->crearProducto();
        $variant = $this->crearVariante($otherProduct);

        $this->putJson(
            "/api/product/{$product->id}/variant/{$variant->id}",
            ['precio' => 150],
            $this->authHeaders()
        )->assertStatus(400);
    }

    public function test_no_elimina_variante_de_otro_producto(): void
    {
        $product = $this->crearProducto();
        $otherProduct = $this->crearProducto();
        $variant = $this->crearVariante($otherProduct);

        $this->deleteJson(
            "/api/product/{$product->id}/variant/{$variant->id}",
            [],
            $this->authHeaders()
        )->assertStatus(400);

        $this->assertDatabaseHas('product_variants', ['id' => $variant->id]);
    }

    public function test_producto_por_peso_no_crea_variante(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::VentaPorPeso]);

        $product = $this->crearProducto(['unidad_medida' => UnidadMedidaEnum::Kg->value]);

        $this->postJson(
            "/api/product/{$product->id}/variant",
            ['nombre' => 'Chica', 'precio' => 80],
            $this->authHeaders()
        )->assertStatus(400);

        $this->assertDatabaseMissing('product_variants', [
            'product_id' => $product->id,
        ]);
    }

    public function test_producto_por_unidad_en_negocio_de_venta_por_peso_si_crea_variante(): void
    {
        $tenant = BusinessConfigModel::first();
        $tenant->update([BusinessConfigModel::TIPO_NEGOCIO => BusinessTypeEnum::VentaPorPeso]);

        $product = $this->crearProducto(['unidad_medida' => UnidadMedidaEnum::Unidad->value]);

        $this->postJson(
            "/api/product/{$product->id}/variant",
            ['nombre' => 'Pieza', 'precio' => 18],
            $this->authHeaders()
        )->assertStatus(200);

        $this->assertDatabaseHas('product_variants', [
            'product_id' => $product->id,
            'nombre' => 'Pieza',
        ]);
    }

    public function test_producto_con_manage_stock_no_crea_variante(): void
    {
        $product = $this->crearProducto([
            'unidad_medida' => UnidadMedidaEnum::Unidad->value,
            'manage_stock' => true,
        ]);

        $this->postJson(
            "/api/product/{$product->id}/variant",
            ['nombre' => 'Pieza', 'precio' => 18],
            $this->authHeaders()
        )->assertStatus(400);

        $this->assertDatabaseMissing('product_variants', [
            'product_id' => $product->id,
        ]);
    }
}
