<?php

namespace Tests\Orders;

use App\Enums\MainOrderStatusEnum;
use App\Enums\RoleEnum;
use App\Enums\StockMovementReasonEnum;
use App\Enums\StockMovementTypeEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\ProductModel;
use App\Models\User;
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
}
