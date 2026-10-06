<?php

namespace Tests\Catalog;

use App\Enums\BusinessTypeEnum;
use App\Enums\MainOrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\AddonModel;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\OrderStatusModel;
use App\Models\ProductModel;
use App\Models\User;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Los toppings son exclusivos de negocios restaurante/cafetería (kitchen_view): el catálogo
 * responde 403 y cualquier intento de asignarlos a productos o a líneas de orden se rechaza en
 * los demás tipos de negocio, aunque la request llegue directo a la API sin pasar por la UI.
 */
class AddonRestaurantOnlyTest extends TestCase
{
    /** Tipos de negocio sin kitchen_view. */
    public static function tiposSinToppings(): array
    {
        return [
            'venta por peso' => [BusinessTypeEnum::VentaPorPeso],
            'retail' => [BusinessTypeEnum::Retail],
        ];
    }

    private function cambiarTipoDeNegocio(BusinessTypeEnum $tipo): void
    {
        BusinessConfigModel::first()->update([BusinessConfigModel::TIPO_NEGOCIO => $tipo->value]);
    }

    private function crearProducto(): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => 'Waffle',
            ProductModel::PRECIO => 45,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearOrden(): OrderModel
    {
        $reporte = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        return OrderModel::create([
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Orden',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusModel::first()->id,
            OrderModel::SISTEMA_ID => $reporte->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    /** Topping asignado a un producto, creado mientras el negocio todavía era restaurante. */
    private function toppingAsignado(ProductModel $producto): AddonModel
    {
        $addon = AddonModel::factory()->create([AddonModel::NAME => 'Nieve', AddonModel::PRICE => 20]);
        $producto->addons()->attach($addon->id, [AddonModel::TENANT_ID => $addon->tenant_id]);

        return $addon;
    }

    // ── Catálogo (/api/addon) ────────────────────────────────

    public function test_restaurante_accede_al_catalogo_de_toppings(): void
    {
        $this->cambiarTipoDeNegocio(BusinessTypeEnum::Restaurante);

        $this->getJson('/api/addon/list', $this->authHeaders())->assertStatus(200);
        $this->postJson('/api/addon', ['name' => 'Nieve'], $this->authHeaders())->assertStatus(200);
    }

    #[DataProvider('tiposSinToppings')]
    public function test_otros_tipos_de_negocio_no_acceden_al_catalogo(BusinessTypeEnum $tipo): void
    {
        $addon = AddonModel::factory()->create();
        $this->cambiarTipoDeNegocio($tipo);

        $this->getJson('/api/addon', $this->authHeaders())->assertStatus(403);
        $this->getJson('/api/addon/list', $this->authHeaders())->assertStatus(403);
        $this->getJson("/api/addon/{$addon->id}", $this->authHeaders())->assertStatus(403);
        $this->postJson('/api/addon', ['name' => 'Nuevo'], $this->authHeaders())->assertStatus(403);
        $this->putJson("/api/addon/{$addon->id}", ['price' => 5], $this->authHeaders())->assertStatus(403);
        $this->putJson("/api/addon/{$addon->id}/products", ['product_ids' => []], $this->authHeaders())->assertStatus(403);
        $this->deleteJson("/api/addon/{$addon->id}", [], $this->authHeaders())->assertStatus(403);

        $this->assertDatabaseCount('addons', 1);
    }

    // ── Asignación desde el formulario de producto ───────────

    public function test_restaurante_puede_asignar_toppings_a_un_producto(): void
    {
        $addon = AddonModel::factory()->create();

        $this->postJson('/api/product', [
            'nombre' => 'Waffle clásico',
            'precio' => 65,
            'categoria_id' => CategoryModel::first()->id,
            'addon_ids' => [$addon->id],
        ], $this->authHeaders())->assertStatus(200)->assertJsonCount(1, 'data.addons');
    }

    #[DataProvider('tiposSinToppings')]
    public function test_otros_tipos_de_negocio_no_pueden_asignar_toppings_a_productos(BusinessTypeEnum $tipo): void
    {
        $addon = AddonModel::factory()->create();
        $producto = $this->crearProducto();
        $this->cambiarTipoDeNegocio($tipo);

        $this->postJson('/api/product', [
            'nombre' => 'Otro producto',
            'precio' => 10,
            'categoria_id' => CategoryModel::first()->id,
            'addon_ids' => [$addon->id],
        ], $this->authHeaders())->assertStatus(400);

        $this->putJson("/api/product/{$producto->id}", [
            'nombre' => $producto->nombre,
            'precio' => $producto->precio,
            'categoria_id' => $producto->categoria_id,
            'addon_ids' => [$addon->id],
        ], $this->authHeaders())->assertStatus(400);

        $this->assertDatabaseCount('addon_product', 0);
    }

    #[DataProvider('tiposSinToppings')]
    public function test_otros_tipos_de_negocio_siguen_guardando_productos_sin_toppings(BusinessTypeEnum $tipo): void
    {
        $producto = $this->crearProducto();
        $this->cambiarTipoDeNegocio($tipo);

        // Sin la llave y con lista vacía: el formulario de un negocio sin toppings no cambia.
        $this->putJson("/api/product/{$producto->id}", [
            'nombre' => $producto->nombre,
            'precio' => $producto->precio,
            'categoria_id' => $producto->categoria_id,
        ], $this->authHeaders())->assertStatus(200);

        $this->putJson("/api/product/{$producto->id}", [
            'nombre' => $producto->nombre,
            'precio' => $producto->precio,
            'categoria_id' => $producto->categoria_id,
            'addon_ids' => [],
        ], $this->authHeaders())->assertStatus(200);
    }

    // ── Líneas de orden ──────────────────────────────────────

    #[DataProvider('tiposSinToppings')]
    public function test_otros_tipos_de_negocio_no_pueden_agregar_toppings_a_una_linea(BusinessTypeEnum $tipo): void
    {
        $producto = $this->crearProducto();
        $addon = $this->toppingAsignado($producto);
        $orden = $this->crearOrden();
        $this->cambiarTipoDeNegocio($tipo);

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $producto->id,
            OrderProductModel::CANTIDAD => 1,
            'addons' => [['addon_id' => $addon->id, 'quantity' => 1]],
        ], $this->authHeaders())->assertStatus(400);

        $this->postJson("/api/order/{$orden->id}/products", ['items' => [
            ['producto_id' => $producto->id, 'cantidad' => 1, 'addons' => [['addon_id' => $addon->id, 'quantity' => 1]]],
        ]], $this->authHeaders())->assertStatus(400);

        $this->assertDatabaseCount('order_product', 0);
        $this->assertDatabaseCount('order_product_addons', 0);
    }

    #[DataProvider('tiposSinToppings')]
    public function test_otros_tipos_de_negocio_siguen_agregando_lineas_sin_toppings(BusinessTypeEnum $tipo): void
    {
        $producto = $this->crearProducto();
        $orden = $this->crearOrden();
        $this->cambiarTipoDeNegocio($tipo);

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $producto->id,
            OrderProductModel::CANTIDAD => 2,
        ], $this->authHeaders())->assertStatus(200);

        $this->postJson("/api/order/{$orden->id}/products", ['items' => [
            ['producto_id' => $producto->id, 'cantidad' => 1],
        ]], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(135, $orden->refresh()->total);
    }
}
