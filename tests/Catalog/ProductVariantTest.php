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

    public function test_producto_con_manage_stock_si_crea_variante_con_stock_propio(): void
    {
        $product = $this->crearProducto([
            'unidad_medida' => UnidadMedidaEnum::Unidad->value,
            'manage_stock' => true,
        ]);

        $this->postJson(
            "/api/product/{$product->id}/variant",
            ['nombre' => 'Talla 26', 'precio' => 18, 'stock' => 5, 'min_stock' => 2],
            $this->authHeaders()
        )->assertStatus(200);

        $this->assertDatabaseHas('product_variants', [
            'product_id' => $product->id,
            'nombre' => 'Talla 26',
            'stock' => 5,
            'min_stock' => 2,
        ]);

        // el producto base no lleva su propio stock cuando la existencia vive en variantes.
        $this->assertEquals(0, (float) $product->fresh()->stock);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'reason' => 'initial_stock',
            'quantity' => 5,
        ]);
    }

    public function test_producto_con_manage_stock_sin_stock_indicado_crea_variante_en_cero(): void
    {
        $product = $this->crearProducto([
            'unidad_medida' => UnidadMedidaEnum::Unidad->value,
            'manage_stock' => true,
        ]);

        $this->postJson(
            "/api/product/{$product->id}/variant",
            ['nombre' => 'Talla 27', 'precio' => 18],
            $this->authHeaders()
        )->assertStatus(200);

        $this->assertDatabaseHas('product_variants', [
            'product_id' => $product->id,
            'nombre' => 'Talla 27',
            'stock' => 0,
            'min_stock' => 2,
        ]);
        $this->assertDatabaseMissing('stock_movements', [
            'product_id' => $product->id,
        ]);
    }

    public function test_actualiza_min_stock_de_variante(): void
    {
        $product = $this->crearProducto([
            'unidad_medida' => UnidadMedidaEnum::Unidad->value,
            'manage_stock' => true,
        ]);
        $variant = ProductVariantModel::factory()->create([
            ProductVariantModel::PRODUCT_ID => $product->id,
            'tenant_id' => BusinessConfigModel::first()->id,
            ProductVariantModel::STOCK => 10,
            ProductVariantModel::MIN_STOCK => 2,
        ]);

        $this->putJson(
            "/api/product/{$product->id}/variant/{$variant->id}",
            ['min_stock' => 5],
            $this->authHeaders()
        )->assertStatus(200)
            ->assertJsonPath('data.min_stock', '5.00');

        $this->assertDatabaseHas('product_variants', [
            'id' => $variant->id,
            'min_stock' => 5,
            'stock' => 10,
        ]);
    }

    public function test_actualizar_variante_no_permite_modificar_stock_directamente(): void
    {
        $product = $this->crearProducto([
            'unidad_medida' => UnidadMedidaEnum::Unidad->value,
            'manage_stock' => true,
        ]);
        $variant = ProductVariantModel::factory()->create([
            ProductVariantModel::PRODUCT_ID => $product->id,
            'tenant_id' => BusinessConfigModel::first()->id,
            ProductVariantModel::STOCK => 10,
        ]);

        // "stock" no es una regla de ProductVariantUpdateRequest — un valor extra en el
        // payload se ignora silenciosamente (mismo comportamiento que Laravel con campos no
        // declarados en rules()), confirmando que la única vía para cambiar stock es el
        // endpoint de ajuste (StockService).
        $this->putJson(
            "/api/product/{$product->id}/variant/{$variant->id}",
            ['stock' => 999],
            $this->authHeaders()
        )->assertStatus(200);

        $this->assertEquals(10.0, (float) $variant->fresh()->stock);
    }

    public function test_variante_has_low_stock_sin_min_stock_configurado_trata_como_cero(): void
    {
        $product = $this->crearProducto([
            'unidad_medida' => UnidadMedidaEnum::Unidad->value,
            'manage_stock' => true,
        ]);
        $sinExistencia = ProductVariantModel::factory()->create([
            ProductVariantModel::PRODUCT_ID => $product->id,
            'tenant_id' => BusinessConfigModel::first()->id,
            ProductVariantModel::STOCK => 0,
            ProductVariantModel::MIN_STOCK => null,
        ]);
        $conExistencia = ProductVariantModel::factory()->create([
            ProductVariantModel::PRODUCT_ID => $product->id,
            'tenant_id' => BusinessConfigModel::first()->id,
            ProductVariantModel::STOCK => 3,
            ProductVariantModel::MIN_STOCK => null,
        ]);

        $this->assertTrue($sinExistencia->hasLowStock());
        $this->assertFalse($conExistencia->hasLowStock());
    }
}
