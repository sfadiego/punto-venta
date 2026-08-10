<?php

namespace Tests\Orders;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
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

    private function crearSistemaCerrado(): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::CLOSED,
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

    public function test_venta_directa_guarda_costo_domicilio_positivo_cuando_lo_paga_el_cliente(): void
    {
        $sistema = $this->crearSistema();
        $product = $this->crearProducto(45);

        $response = $this->postJson('/api/order/sale', [
            'sistema_id' => $sistema->id,
            'nombre_pedido' => 'Venta mostrador',
            'costo_domicilio' => 30,
            'items' => [
                ['producto_id' => $product->id, 'cantidad' => 2],
            ],
        ], $this->authHeaders())
            ->assertStatus(200)
            // El total guardado es solo el subtotal de productos — el domicilio se suma
            // aparte en el frontend (calcDeliveryTotal), no se acumula al total del pedido.
            ->assertJsonPath('data.total', 90)
            ->assertJsonPath('data.costo_domicilio', 30);

        $this->assertDatabaseHas('order', [
            'id' => $response->json('data.id'),
            'costo_domicilio' => 30,
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
        ]);
    }

    public function test_venta_directa_guarda_costo_domicilio_negativo_cuando_lo_absorbe_el_negocio(): void
    {
        $sistema = $this->crearSistema();
        $product = $this->crearProducto(45);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sistema->id,
            'nombre_pedido' => 'Venta mostrador',
            'costo_domicilio' => -30,
            'items' => [
                ['producto_id' => $product->id, 'cantidad' => 1],
            ],
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.costo_domicilio', -30);
    }

    public function test_venta_directa_sin_costo_domicilio_lo_guarda_en_cero(): void
    {
        $sistema = $this->crearSistema();
        $product = $this->crearProducto(45);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sistema->id,
            'nombre_pedido' => 'Venta mostrador',
            'items' => [
                ['producto_id' => $product->id, 'cantidad' => 1],
            ],
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.costo_domicilio', 0);
    }

    public function test_venta_directa_con_caja_cerrada_falla(): void
    {
        $sistema = $this->crearSistemaCerrado();
        $product = $this->crearProducto(45);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sistema->id,
            'nombre_pedido' => 'Venta con caja cerrada',
            'items' => [
                ['producto_id' => $product->id, 'cantidad' => 1],
            ],
        ], $this->authHeaders())
            ->assertStatus(400)
            ->assertJsonPath('data.sistema_id.0', 'La caja de esta venta ya está cerrada.');

        $this->assertDatabaseMissing('order', ['nombre_pedido' => 'Venta con caja cerrada']);
    }
}
