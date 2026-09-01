<?php

namespace Tests\Catalog;

use App\Enums\RoleEnum;
use App\Enums\StockMovementReasonEnum;
use App\Enums\StockMovementTypeEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use App\Models\User;
use Tests\TestCase;

class ProductStockAdjustmentTest extends TestCase
{
    private function crearProductoConStock(float $stock = 10, bool $manageStock = true): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => 'Producto con stock',
            ProductModel::PRECIO => 20,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => $manageStock,
            ProductModel::STOCK => $manageStock ? $stock : null,
        ]);
    }

    public function test_ajuste_positivo_incrementa_stock_y_registra_movimiento(): void
    {
        $product = $this->crearProductoConStock(10);

        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => 5,
            'note' => 'Reposición de mercancía',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.stock', '15.00');

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovementTypeEnum::Adjustment->value,
            'reason' => StockMovementReasonEnum::ManualAdjustment->value,
            'quantity' => 5,
            'stock_before' => 10,
            'stock_after' => 15,
            'note' => 'Reposición de mercancía',
        ]);
    }

    public function test_ajuste_negativo_reduce_stock(): void
    {
        $product = $this->crearProductoConStock(10);

        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => -3,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.stock', '7.00');
    }

    public function test_ajuste_que_dejaria_stock_negativo_falla(): void
    {
        $product = $this->crearProductoConStock(2);

        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => -5,
        ], $this->authHeaders())
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');

        $this->assertEquals(2.0, (float) $product->fresh()->stock);
    }

    public function test_delta_cero_falla_validacion(): void
    {
        $product = $this->crearProductoConStock(10);

        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => 0,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_delta_requerido(): void
    {
        $product = $this->crearProductoConStock(10);

        $this->postJson("/api/product/{$product->id}/stock-adjustment", [], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_ajuste_en_producto_sin_manage_stock_falla(): void
    {
        $product = $this->crearProductoConStock(0, false);

        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => 5,
        ], $this->authHeaders())
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');
    }

    public function test_ajuste_registra_usuario_autenticado(): void
    {
        $product = $this->crearProductoConStock(10);
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => 1,
        ], $this->authHeaders($user))->assertStatus(200);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'created_by' => $user->id,
        ]);
    }

    public function test_sin_autenticacion_no_accede(): void
    {
        $product = $this->crearProductoConStock(10);

        $this->postJson("/api/product/{$product->id}/stock-adjustment", ['delta' => 5])
            ->assertStatus(401);
    }

    public function test_ajuste_con_variant_id_modifica_stock_de_la_variante_no_del_producto(): void
    {
        $product = $this->crearProductoConStock(10);
        $variant = ProductVariantModel::factory()->create([
            ProductVariantModel::PRODUCT_ID => $product->id,
            'tenant_id' => BusinessConfigModel::first()->id,
            ProductVariantModel::STOCK => 5,
        ]);

        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => 3,
            'variant_id' => $variant->id,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.stock', '8.00');

        $this->assertEquals(10.0, (float) $product->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'type' => StockMovementTypeEnum::Adjustment->value,
            'quantity' => 3,
            'stock_before' => 5,
            'stock_after' => 8,
        ]);
    }

    public function test_ajuste_con_variant_id_de_otro_producto_falla_validacion(): void
    {
        $product = $this->crearProductoConStock(10);
        $otroProducto = $this->crearProductoConStock(10);
        $variant = ProductVariantModel::factory()->create([
            ProductVariantModel::PRODUCT_ID => $otroProducto->id,
            'tenant_id' => BusinessConfigModel::first()->id,
            ProductVariantModel::STOCK => 5,
        ]);

        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => 3,
            'variant_id' => $variant->id,
        ], $this->authHeaders())
            ->assertStatus(400);
    }
}
