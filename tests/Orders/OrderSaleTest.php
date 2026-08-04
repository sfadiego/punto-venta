<?php

namespace Tests\Orders;

use App\Enums\MainOrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use App\Models\User;
use Tests\TestCase;

class OrderSaleTest extends TestCase
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

    private function crearProducto(float $precio = 45): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => 'Producto Test',
            ProductModel::PRECIO => $precio,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
        ]);
    }

    private function crearVariante(ProductModel $product, float $precio = 150): ProductVariantModel
    {
        return ProductVariantModel::factory()->create([
            ProductVariantModel::PRODUCT_ID => $product->id,
            ProductVariantModel::PRECIO => $precio,
            'tenant_id' => BusinessConfigModel::first()->id,
        ]);
    }

    public function test_venta_directa_sin_variante_ignora_precio_del_cliente(): void
    {
        $sistema = $this->crearSistema();
        $product = $this->crearProducto(45);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sistema->id,
            'nombre_pedido' => 'Venta mostrador',
            'items' => [
                ['producto_id' => $product->id, 'cantidad' => 2, 'precio' => 999999],
            ],
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total', 90);

        $this->assertDatabaseHas('order_product', [
            'producto_id' => $product->id,
            'precio' => 45,
        ]);
    }

    public function test_venta_directa_con_variante_usa_precio_de_variante(): void
    {
        $sistema = $this->crearSistema();
        $product = $this->crearProducto(45);
        $variant = $this->crearVariante($product, 150);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sistema->id,
            'nombre_pedido' => 'Venta mostrador',
            'items' => [
                ['producto_id' => $product->id, 'variant_id' => $variant->id, 'cantidad' => 1, 'precio' => 1],
            ],
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.total', 150);

        $this->assertDatabaseHas('order_product', [
            'producto_id' => $product->id,
            'variant_id' => $variant->id,
            'precio' => 150,
        ]);
    }
}
