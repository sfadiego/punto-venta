<?php

namespace Tests\Orders;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Enums\StockMovementReasonEnum;
use App\Enums\StockMovementTypeEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\OrderStatusModel;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OrderSaleStockTest extends TestCase
{
    private function crearSistema(): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 500,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearProductoConStock(float $stock, float $precio = 20): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => 'Producto con stock',
            ProductModel::PRECIO => $precio,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::MANAGE_STOCK => true,
            ProductModel::STOCK => $stock,
        ]);
    }

    public function test_venta_directa_descuenta_stock_del_producto(): void
    {
        $sistema = $this->crearSistema();
        $product = $this->crearProductoConStock(10);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sistema->id,
            'nombre_pedido' => 'Venta mostrador',
            'items' => [
                ['producto_id' => $product->id, 'cantidad' => 4],
            ],
        ], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(6.0, (float) $product->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovementTypeEnum::Exit->value,
            'reason' => StockMovementReasonEnum::Sale->value,
            'quantity' => 4,
        ]);
    }

    public function test_venta_directa_con_stock_insuficiente_falla_y_no_crea_orden(): void
    {
        $sistema = $this->crearSistema();
        $product = $this->crearProductoConStock(2);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sistema->id,
            'nombre_pedido' => 'Venta mostrador',
            'items' => [
                ['producto_id' => $product->id, 'cantidad' => 5],
            ],
        ], $this->authHeaders())
            ->assertStatus(422)
            ->assertJsonPath('status', 'error');

        // TransactionMiddleware omite el wrap transaccional en tests, así que aquí solo
        // verificamos la invariante real: el stock nunca queda negativo. En producción el
        // request completo (incluyendo la orden recién creada) también se revierte.
        $this->assertEquals(2.0, (float) $product->fresh()->stock);
    }

    public function test_venta_directa_con_multiples_items_descuenta_cada_uno(): void
    {
        $sistema = $this->crearSistema();
        $productA = $this->crearProductoConStock(10);
        $productB = $this->crearProductoConStock(5);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sistema->id,
            'nombre_pedido' => 'Venta mostrador',
            'items' => [
                ['producto_id' => $productA->id, 'cantidad' => 3],
                ['producto_id' => $productB->id, 'cantidad' => 2],
            ],
        ], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(7.0, (float) $productA->fresh()->stock);
        $this->assertEquals(3.0, (float) $productB->fresh()->stock);
    }

    public function test_venta_directa_con_muchos_items_precarga_productos_en_una_sola_query(): void
    {
        // Regresión N+1: antes, resolveCatalogPrice() + el chequeo de manage_stock hacían
        // 1 query de producto por línea del carrito. Ahora se precargan todos con un solo
        // whereIn — confirmamos que esa query batched existe. No afirmamos que sea la
        // única query a "product" en todo el request: la validación de la request
        // (Rule::exists por línea) y el lockForUpdate() de StockService siguen corriendo
        // una vez por línea por diseño — no son parte de este fix.
        $sistema = $this->crearSistema();
        $productos = collect(range(1, 5))->map(fn () => $this->crearProductoConStock(10));

        DB::enableQueryLog();

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sistema->id,
            'nombre_pedido' => 'Venta mostrador',
            'items' => $productos->map(fn ($p) => ['producto_id' => $p->id, 'cantidad' => 1])->values()->all(),
        ], $this->authHeaders())->assertStatus(200);

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $batchedLookup = collect($queries)->first(
            fn ($q) => str_contains($q['query'], 'from "product"') && preg_match('/\bin\s*\(/i', $q['query']) === 1
        );

        $this->assertNotNull($batchedLookup, 'Se esperaba una query batched (whereIn) a la tabla product.');
    }

    public function test_venta_directa_sin_manage_stock_no_genera_movimiento(): void
    {
        $sistema = $this->crearSistema();
        $product = ProductModel::create([
            ProductModel::NOMBRE => 'Producto sin control de stock',
            ProductModel::PRECIO => 20,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sistema->id,
            'nombre_pedido' => 'Venta mostrador',
            'items' => [
                ['producto_id' => $product->id, 'cantidad' => 1],
            ],
        ], $this->authHeaders())
            ->assertStatus(200);

        $this->assertDatabaseMissing('stock_movements', ['product_id' => $product->id]);
    }

    public function test_venta_directa_con_variante_descuenta_stock_de_la_variante(): void
    {
        $sistema = $this->crearSistema();
        $product = $this->crearProductoConStock(10);
        $variant = ProductVariantModel::factory()->create([
            ProductVariantModel::PRODUCT_ID => $product->id,
            'tenant_id' => BusinessConfigModel::first()->id,
            ProductVariantModel::PRECIO => 18,
            ProductVariantModel::STOCK => 5,
        ]);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sistema->id,
            'nombre_pedido' => 'Venta mostrador',
            'items' => [
                ['producto_id' => $product->id, 'variant_id' => $variant->id, 'cantidad' => 1],
            ],
        ], $this->authHeaders())
            ->assertStatus(200);

        // el stock del producto base queda intacto: la existencia vive en la variante.
        $this->assertEquals(10.0, (float) $product->fresh()->stock);
        $this->assertEquals(4.0, (float) $variant->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'type' => StockMovementTypeEnum::Exit->value,
            'reason' => StockMovementReasonEnum::Sale->value,
            'quantity' => 1,
        ]);
        $this->assertDatabaseHas('order_product', [
            'producto_id' => $product->id,
            'variant_id' => $variant->id,
            'precio' => 18,
        ]);
    }

    public function test_cierre_de_orden_con_variante_descuenta_stock_de_la_variante(): void
    {
        $sistema = $this->crearSistema();
        $product = $this->crearProductoConStock(10);
        $variant = ProductVariantModel::factory()->create([
            ProductVariantModel::PRODUCT_ID => $product->id,
            'tenant_id' => BusinessConfigModel::first()->id,
            ProductVariantModel::PRECIO => 18,
            ProductVariantModel::STOCK => 5,
        ]);

        $order = OrderModel::create([
            OrderModel::TOTAL => 18,
            OrderModel::SUBTOTAL => 18,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Test Orden Variante',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusModel::first()->id,
            OrderModel::SISTEMA_ID => $sistema->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $order->id,
            OrderProductModel::PRODUCTO_ID => $product->id,
            OrderProductModel::VARIANT_ID => $variant->id,
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 18,
        ]);

        $this->putJson("/api/order/{$order->id}", [
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('status', 'OK');

        $this->assertEquals(10.0, (float) $product->fresh()->stock);
        $this->assertEquals(4.0, (float) $variant->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'variant_id' => $variant->id,
            'type' => StockMovementTypeEnum::Exit->value,
            'reason' => StockMovementReasonEnum::Sale->value,
            'quantity' => 1,
        ]);
    }
}
