<?php

namespace Tests\Catalog;

use App\Enums\RoleEnum;
use App\Enums\StockMovementReasonEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use App\Models\StockMovementModel;
use App\Models\User;
use Tests\TestCase;

class ProductStockMovementsTest extends TestCase
{
    private function crearProductoConStock(float $stock = 10): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => 'Producto con stock',
            ProductModel::PRECIO => 20,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => true,
            ProductModel::STOCK => $stock,
        ]);
    }

    public function test_lista_movimientos_del_producto(): void
    {
        $product = $this->crearProductoConStock(10);
        $user = User::where('rol_id', RoleEnum::ADMIN->value)->first();

        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => 5,
            'note' => 'Reposición',
        ], $this->authHeaders($user))->assertStatus(200);

        $this->getJson("/api/product/{$product->id}/stock-movements", $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonStructure(['current_page', 'data', 'total', 'per_page', 'last_page'])
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.quantity', '5.00')
            ->assertJsonPath('data.0.stock_before', '10.00')
            ->assertJsonPath('data.0.stock_after', '15.00')
            ->assertJsonPath('data.0.note', 'Reposición')
            ->assertJsonPath('data.0.reason', StockMovementReasonEnum::ManualAdjustment->value)
            ->assertJsonPath('data.0.created_by.id', $user->id);
    }

    public function test_movimientos_ordenados_mas_reciente_primero(): void
    {
        $product = $this->crearProductoConStock(10);

        $tenantId = BusinessConfigModel::first()->id;

        $older = StockMovementModel::create([
            StockMovementModel::PRODUCT_ID => $product->id,
            StockMovementModel::TYPE => 'entry',
            StockMovementModel::QUANTITY => 1,
            StockMovementModel::STOCK_BEFORE => 9,
            StockMovementModel::STOCK_AFTER => 10,
            StockMovementModel::REASON => 'manual_adjustment',
            StockMovementModel::TENANT_ID => $tenantId,
        ]);
        // update() respeta $fillable (created_at no está ahí) — se asigna directo para
        // saltarse la protección de mass assignment.
        $older->created_at = now()->subDay();
        $older->save();
        StockMovementModel::create([
            StockMovementModel::PRODUCT_ID => $product->id,
            StockMovementModel::TYPE => 'exit',
            StockMovementModel::QUANTITY => 2,
            StockMovementModel::STOCK_BEFORE => 10,
            StockMovementModel::STOCK_AFTER => 8,
            StockMovementModel::REASON => 'sale',
            StockMovementModel::TENANT_ID => $tenantId,
        ]);

        $response = $this->getJson("/api/product/{$product->id}/stock-movements", $this->authHeaders())
            ->assertStatus(206);

        $this->assertEquals('sale', $response->json('data.0.reason'));
    }

    public function test_producto_sin_movimientos_retorna_lista_vacia(): void
    {
        $product = $this->crearProductoConStock(10);

        $this->getJson("/api/product/{$product->id}/stock-movements", $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonPath('data', []);
    }

    public function test_no_incluye_movimientos_de_otro_producto(): void
    {
        $productA = $this->crearProductoConStock(10);
        $productB = $this->crearProductoConStock(10);

        $this->postJson("/api/product/{$productB->id}/stock-adjustment", [
            'delta' => 3,
        ], $this->authHeaders())->assertStatus(200);

        $this->getJson("/api/product/{$productA->id}/stock-movements", $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonPath('data', []);
    }

    public function test_movimientos_respeta_paginacion(): void
    {
        $product = $this->crearProductoConStock(100);
        $tenantId = BusinessConfigModel::first()->id;

        for ($i = 0; $i < 5; $i++) {
            StockMovementModel::create([
                StockMovementModel::PRODUCT_ID => $product->id,
                StockMovementModel::TYPE => 'entry',
                StockMovementModel::QUANTITY => 1,
                StockMovementModel::STOCK_BEFORE => 100,
                StockMovementModel::STOCK_AFTER => 101,
                StockMovementModel::REASON => 'manual_adjustment',
                StockMovementModel::TENANT_ID => $tenantId,
            ]);
        }

        $response = $this->getJson("/api/product/{$product->id}/stock-movements?page=1&limit=2", $this->authHeaders())
            ->assertStatus(206);

        $this->assertCount(2, $response->json('data'));
        $this->assertEquals(1, $response->json('current_page'));
        $this->assertEquals(2, $response->json('per_page'));
        $this->assertEquals(5, $response->json('total'));
        $this->assertEquals(3, $response->json('last_page'));
    }

    public function test_sin_autenticacion_no_accede(): void
    {
        $product = $this->crearProductoConStock(10);

        $this->getJson("/api/product/{$product->id}/stock-movements")
            ->assertStatus(401);
    }

    public function test_movimientos_filtrados_por_variant_id_solo_incluyen_esa_variante(): void
    {
        $product = $this->crearProductoConStock(10);
        $variant = ProductVariantModel::factory()->create([
            ProductVariantModel::PRODUCT_ID => $product->id,
            'tenant_id' => BusinessConfigModel::first()->id,
            ProductVariantModel::STOCK => 5,
        ]);

        // movimiento a nivel producto (sin variante)
        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => 1,
        ], $this->authHeaders())->assertStatus(200);

        // movimiento de la variante
        $this->postJson("/api/product/{$product->id}/stock-adjustment", [
            'delta' => 2,
            'variant_id' => $variant->id,
        ], $this->authHeaders())->assertStatus(200);

        $this->getJson("/api/product/{$product->id}/stock-movements?variant_id={$variant->id}", $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.quantity', '2.00');

        $this->getJson("/api/product/{$product->id}/stock-movements", $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.quantity', '1.00');
    }
}
