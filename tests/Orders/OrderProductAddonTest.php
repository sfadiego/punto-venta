<?php

namespace Tests\Orders;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\AddonModel;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductAddonModel;
use App\Models\OrderProductModel;
use App\Models\OrderStatusModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\User;
use Tests\TestCase;

/**
 * Toppings en las líneas de una orden (fase 3a): validación, copia de nombre/precio, cálculo
 * de subtotal/total (cantidad y descuento multiplican también a los toppings) y consistencia
 * con el recálculo de OrderModel::totalOrderProducts().
 */
class OrderProductAddonTest extends TestCase
{
    private function crearReporte(): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearOrden(int $descuentoOrden = 0): OrderModel
    {
        return OrderModel::create([
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
            OrderModel::DESCUENTO => $descuentoOrden,
            OrderModel::NOMBRE_PEDIDO => 'Mesa toppings',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusModel::first()->id,
            OrderModel::SISTEMA_ID => $this->crearReporte()->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearProducto(float $precio = 45, string $nombre = 'Waffle'): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => $nombre,
            ProductModel::PRECIO => $precio,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    /** Crea un topping y lo asigna al producto indicado (null = sin asignar a ninguno). */
    private function crearTopping(string $nombre, float $precio, ?ProductModel $producto = null, bool $activo = true): AddonModel
    {
        $addon = AddonModel::factory()->create([
            AddonModel::NAME => $nombre,
            AddonModel::PRICE => $precio,
            AddonModel::IS_ACTIVE => $activo,
        ]);

        if ($producto) {
            $producto->addons()->attach($addon->id, [AddonModel::TENANT_ID => $addon->tenant_id]);
        }

        return $addon;
    }

    private function agregar(OrderModel $orden, ProductModel $producto, array $extra = [])
    {
        return $this->postJson("/api/order/{$orden->id}/product", array_merge([
            OrderProductModel::PRODUCTO_ID => $producto->id,
            OrderProductModel::CANTIDAD => 1,
        ], $extra), $this->authHeaders());
    }

    private function usuarioConPermiso(RoleEnum $rol, string $permiso): User
    {
        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => $rol->value,
            RolePermission::PERMISSION_ID => Permission::where(Permission::KEY, $permiso)->firstOrFail()->id,
        ]);

        return User::factory()->create([
            User::ROL_ID => $rol->value,
            User::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    // ── Alta individual: cálculo ─────────────────────────────

    public function test_agrega_producto_con_toppings_y_calcula_el_total(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);
        $chocolate = $this->crearTopping('Chocolate', 10, $waffle);

        // Unitario: 45 + 20×1 + 10×2 = 85; × 2 waffles = 170.
        $this->agregar($orden, $waffle, [
            OrderProductModel::CANTIDAD => 2,
            'addons' => [
                ['addon_id' => $nieve->id, 'quantity' => 1],
                ['addon_id' => $chocolate->id, 'quantity' => 2],
            ],
        ])->assertStatus(200)->assertJsonCount(2, 'data.addons');

        $orden->refresh();
        $this->assertEquals(170, $orden->subtotal);
        $this->assertEquals(170, $orden->total);
        $this->assertDatabaseHas('order_product_addons', [
            'addon_id' => $nieve->id, 'name' => 'Nieve', 'price' => 20, 'quantity' => 1,
            'tenant_id' => BusinessConfigModel::first()->id,
        ]);
    }

    public function test_descuento_de_la_linea_aplica_tambien_a_los_toppings(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);

        // (45 + 20) × 2 × 0.9 = 117.
        $this->agregar($orden, $waffle, [
            OrderProductModel::CANTIDAD => 2,
            OrderProductModel::DESCUENTO => 10,
            'addons' => [['addon_id' => $nieve->id, 'quantity' => 1]],
        ])->assertStatus(200);

        $this->assertEquals(117, $orden->refresh()->subtotal);
    }

    public function test_descuento_de_la_orden_aplica_sobre_el_subtotal_con_toppings(): void
    {
        $orden = $this->crearOrden(descuentoOrden: 10);
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);

        $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]])->assertStatus(200);

        $orden->refresh();
        $this->assertEquals(65, $orden->subtotal);
        $this->assertEquals(58.5, $orden->total);
    }

    public function test_topping_sin_costo_no_cambia_el_total(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $servilletas = $this->crearTopping('Servilletas', 0, $waffle);

        $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $servilletas->id, 'quantity' => 3]]])->assertStatus(200);

        $this->assertEquals(45, $orden->refresh()->total);
        $this->assertDatabaseHas('order_product_addons', ['addon_id' => $servilletas->id, 'quantity' => 3]);
    }

    public function test_linea_sin_toppings_se_comporta_como_antes(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);

        $this->agregar($orden, $waffle, [OrderProductModel::CANTIDAD => 2])
            ->assertStatus(200)
            ->assertJsonCount(0, 'data.addons');

        $this->assertEquals(90, $orden->refresh()->total);
        $this->assertDatabaseCount('order_product_addons', 0);
    }

    public function test_el_precio_del_topping_se_copia_y_no_cambia_si_el_catalogo_cambia(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);
        $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]])->assertStatus(200);

        $nieve->update([AddonModel::PRICE => 99, AddonModel::NAME => 'Nieve premium']);

        // GET /order/{id} recalcula el total desde las líneas: debe seguir usando la copia (20).
        $this->getJson("/api/order/{$orden->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.order_products.0.addons.0.name', 'Nieve')
            ->assertJsonPath('data.total', 65);

        $this->assertEquals(65, $orden->refresh()->total);
    }

    public function test_borrar_el_topping_del_catalogo_conserva_la_copia_en_la_venta(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);
        $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]])->assertStatus(200);

        $nieve->delete();

        $this->getJson("/api/order/{$orden->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.order_products.0.addons.0.name', 'Nieve')
            ->assertJsonPath('data.total', 65);
    }

    // ── Alta individual: validación ──────────────────────────

    public function test_rechaza_topping_que_no_se_ofrece_con_el_producto(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $otroProducto = $this->crearProducto(30, 'Café');
        $nieve = $this->crearTopping('Nieve', 20, $otroProducto);

        $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]])->assertStatus(400);

        $this->assertDatabaseCount('order_product', 0);
        $this->assertEquals(0, $orden->refresh()->total);
    }

    public function test_rechaza_topping_inactivo(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle, activo: false);

        $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]])->assertStatus(400);
    }

    public function test_rechaza_topping_eliminado_del_catalogo(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);
        $nieve->delete();

        $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]])->assertStatus(400);
    }

    public function test_rechaza_topping_de_otro_tenant(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $otroTenant = BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'otro-tenant-toppings-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Otro Tenant',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
        ]);
        $ajeno = AddonModel::create([AddonModel::NAME => 'Ajeno', AddonModel::TENANT_ID => $otroTenant->id]);

        $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $ajeno->id, 'quantity' => 1]]])->assertStatus(400);
    }

    public function test_rechaza_topping_repetido_en_la_misma_linea(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);

        $this->agregar($orden, $waffle, ['addons' => [
            ['addon_id' => $nieve->id, 'quantity' => 1],
            ['addon_id' => $nieve->id, 'quantity' => 2],
        ]])->assertStatus(400);
    }

    public function test_rechaza_cantidad_de_topping_invalida(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);

        foreach ([0, -1, 100, 1.5] as $cantidad) {
            $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $nieve->id, 'quantity' => $cantidad]]])
                ->assertStatus(400);
        }
    }

    public function test_extra_libre_no_admite_toppings(): void
    {
        $orden = $this->crearOrden();
        $nieve = $this->crearTopping('Nieve', 20);

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::NOMBRE_EXTRA => 'Envío',
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 30,
            'addons' => [['addon_id' => $nieve->id, 'quantity' => 1]],
        ], $this->authHeaders())->assertStatus(400);
    }

    // ── Alta en lote ─────────────────────────────────────────

    public function test_lote_con_toppings_calcula_el_total_y_permite_el_mismo_topping_en_distintas_lineas(): void
    {
        $orden = $this->crearOrden();
        $waffleA = $this->crearProducto(45, 'Waffle A');
        $waffleB = $this->crearProducto(50, 'Waffle B');
        $cafe = $this->crearProducto(30, 'Café');
        $nieve = $this->crearTopping('Nieve', 20, $waffleA);
        $waffleB->addons()->attach($nieve->id, [AddonModel::TENANT_ID => $nieve->tenant_id]);

        // A: (45+20)×2 = 130 · B: (50+20)×1 = 70 · Café sin toppings: 30 → 230.
        $response = $this->postJson("/api/order/{$orden->id}/products", ['items' => [
            ['producto_id' => $waffleA->id, 'cantidad' => 2, 'addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]],
            ['producto_id' => $waffleB->id, 'cantidad' => 1, 'addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]],
            ['producto_id' => $cafe->id, 'cantidad' => 1],
        ]], $this->authHeaders())->assertStatus(200);

        $this->assertCount(2, array_filter($response->json('data'), fn ($line) => count($line['addons']) === 1));
        $this->assertEquals(230, $orden->refresh()->total);
        $this->assertDatabaseCount('order_product_addons', 2);
    }

    public function test_lote_rechaza_toda_la_request_si_un_topping_no_aplica(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $cafe = $this->crearProducto(30, 'Café');
        $nieve = $this->crearTopping('Nieve', 20, $waffle);

        $this->postJson("/api/order/{$orden->id}/products", ['items' => [
            ['producto_id' => $waffle->id, 'cantidad' => 1, 'addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]],
            ['producto_id' => $cafe->id, 'cantidad' => 1, 'addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]],
        ]], $this->authHeaders())->assertStatus(400);

        $this->assertDatabaseCount('order_product', 0);
        $this->assertDatabaseCount('order_product_addons', 0);
        $this->assertEquals(0, $orden->refresh()->total);
    }

    // ── Edición ──────────────────────────────────────────────

    public function test_cambiar_la_cantidad_de_la_linea_multiplica_tambien_los_toppings(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);
        $lineaId = $this->agregar($orden, $waffle, [
            OrderProductModel::CANTIDAD => 2,
            'addons' => [['addon_id' => $nieve->id, 'quantity' => 1]],
        ])->json('data.id');

        $this->putJson("/api/order/{$orden->id}/product/{$lineaId}", [OrderProductModel::CANTIDAD => 3], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonCount(1, 'data.addons');

        // (45 + 20) × 3 = 195; los toppings no se tocaron al no enviar "addons".
        $this->assertEquals(195, $orden->refresh()->total);
    }

    public function test_reemplazar_los_toppings_de_la_linea_recalcula_el_total(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);
        $chocolate = $this->crearTopping('Chocolate', 10, $waffle);
        $lineaId = $this->agregar($orden, $waffle, [
            OrderProductModel::CANTIDAD => 2,
            'addons' => [['addon_id' => $nieve->id, 'quantity' => 1]],
        ])->json('data.id');

        $this->putJson("/api/order/{$orden->id}/product/{$lineaId}", [
            'addons' => [['addon_id' => $chocolate->id, 'quantity' => 2]],
        ], $this->authHeaders())->assertStatus(200)->assertJsonPath('data.addons.0.name', 'Chocolate');

        // (45 + 10×2) × 2 = 130.
        $this->assertEquals(130, $orden->refresh()->total);
        $this->assertDatabaseMissing('order_product_addons', ['addon_id' => $nieve->id]);
    }

    public function test_enviar_addons_vacio_quita_todos_los_toppings_de_la_linea(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);
        $lineaId = $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]])->json('data.id');

        $this->putJson("/api/order/{$orden->id}/product/{$lineaId}", ['addons' => []], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonCount(0, 'data.addons');

        $this->assertEquals(45, $orden->refresh()->total);
        $this->assertDatabaseCount('order_product_addons', 0);
    }

    public function test_edicion_rechaza_topping_que_no_aplica_al_producto_de_la_linea(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $cafe = $this->crearProducto(30, 'Café');
        $nieve = $this->crearTopping('Nieve', 20, $cafe);
        $lineaId = $this->agregar($orden, $waffle)->json('data.id');

        $this->putJson("/api/order/{$orden->id}/product/{$lineaId}", [
            'addons' => [['addon_id' => $nieve->id, 'quantity' => 1]],
        ], $this->authHeaders())->assertStatus(400);

        $this->assertEquals(45, $orden->refresh()->total);
    }

    // ── Borrado ──────────────────────────────────────────────

    public function test_borrar_la_linea_resta_sus_toppings_del_total_y_los_elimina(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $cafe = $this->crearProducto(30, 'Café');
        $nieve = $this->crearTopping('Nieve', 20, $waffle);
        $lineaId = $this->agregar($orden, $waffle, [
            OrderProductModel::CANTIDAD => 2,
            'addons' => [['addon_id' => $nieve->id, 'quantity' => 1]],
        ])->json('data.id');
        $this->agregar($orden, $cafe)->assertStatus(200);
        $this->assertEquals(160, $orden->refresh()->total);

        $this->deleteJson("/api/order/{$orden->id}/product/{$lineaId}", [], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(30, $orden->refresh()->total);
        $this->assertDatabaseCount('order_product_addons', 0);
    }

    public function test_vaciar_el_carrito_elimina_tambien_los_toppings(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);
        $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]])->assertStatus(200);

        $this->deleteJson("/api/order/{$orden->id}/clear-cart", [], $this->authHeaders())->assertStatus(200);

        $this->assertEquals(0, $orden->refresh()->total);
        $this->assertDatabaseCount('order_product_addons', 0);
    }

    // ── Lectura ──────────────────────────────────────────────

    public function test_el_listado_de_productos_de_la_orden_incluye_los_toppings(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);
        $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $nieve->id, 'quantity' => 2]]])->assertStatus(200);

        $this->getJson("/api/order/{$orden->id}/product", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.0.addons.0.name', 'Nieve')
            ->assertJsonPath('data.0.addons.0.quantity', 2);

        $this->getJson("/api/order/{$orden->id}/product/{$waffle->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.0.addons.0.name', 'Nieve');
    }

    public function test_el_precio_de_los_toppings_se_serializa_como_numero(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);

        $response = $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]])->assertStatus(200);

        $this->assertIsNotString($response->json('data.addons.0.price'));
        $this->assertEquals(20, $response->json('data.addons.0.price'));
    }

    // ── Reporte por categoría ────────────────────────────────

    public function test_el_reporte_por_categoria_incluye_el_ingreso_de_los_toppings(): void
    {
        $reporte = $this->crearReporte();
        $waffle = $this->crearProducto(45);
        $orden = OrderModel::create([
            OrderModel::TOTAL => 130,
            OrderModel::SUBTOTAL => 130,
            OrderModel::DESCUENTO => 0,
            OrderModel::NOMBRE_PEDIDO => 'Venta cerrada',
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            OrderModel::SISTEMA_ID => $reporte->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
        $linea = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::PRODUCTO_ID => $waffle->id,
            OrderProductModel::CANTIDAD => 2,
            OrderProductModel::PRECIO => 45,
            OrderProductModel::DESCUENTO => 0,
        ]);
        OrderProductAddonModel::create([
            OrderProductAddonModel::ORDER_PRODUCT_ID => $linea->id,
            OrderProductAddonModel::NAME => 'Nieve',
            OrderProductAddonModel::PRICE => 20,
            OrderProductAddonModel::QUANTITY => 1,
            OrderProductAddonModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);

        // (45 + 20) × 2 = 130: el ingreso de la categoría cuadra con el total de la orden.
        $response = $this->getJson("/api/order/sales-by-category?sistema_id={$reporte->id}", $this->authHeaders())
            ->assertStatus(200);

        $categoria = collect($response->json('data.categories'))->firstWhere('id', $waffle->categoria_id);
        $this->assertEquals(130, $categoria['total_revenue']);
    }

    // ── Autorización (par positivo y negativo) ───────────────

    public function test_rol_con_take_order_puede_agregar_productos_con_toppings(): void
    {
        $empleado = $this->usuarioConPermiso(RoleEnum::EMPLOYE, 'takeOrder');
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $waffle->id,
            OrderProductModel::CANTIDAD => 1,
            'addons' => [['addon_id' => $nieve->id, 'quantity' => 1]],
        ], $this->authHeaders($empleado))->assertStatus(200);

        $this->assertEquals(65, $orden->refresh()->total);
    }

    public function test_rol_sin_permiso_de_pedidos_no_puede_agregar_toppings(): void
    {
        $caja = $this->usuarioConPermiso(RoleEnum::CAJA, 'payOrder');
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);

        $this->postJson("/api/order/{$orden->id}/product", [
            OrderProductModel::PRODUCTO_ID => $waffle->id,
            OrderProductModel::CANTIDAD => 1,
            'addons' => [['addon_id' => $nieve->id, 'quantity' => 1]],
        ], $this->authHeaders($caja))->assertStatus(403);

        $this->assertDatabaseCount('order_product_addons', 0);
    }

    public function test_la_orden_incluye_los_toppings_que_ofrece_cada_producto_para_editar_la_linea(): void
    {
        $orden = $this->crearOrden();
        $waffle = $this->crearProducto(45);
        $nieve = $this->crearTopping('Nieve', 20, $waffle);
        $chocolate = $this->crearTopping('Chocolate', 10, $waffle);
        $this->agregar($orden, $waffle, ['addons' => [['addon_id' => $nieve->id, 'quantity' => 1]]])->assertStatus(200);

        // Los elegidos viajan en la línea y los disponibles en el producto.
        $this->getJson("/api/order/{$orden->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonCount(1, 'data.order_products.0.addons')
            ->assertJsonCount(2, 'data.order_products.0.product.addons');

        $this->getJson("/api/order/{$orden->id}/product", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.0.product.addons.1.id', $chocolate->id);
    }
}
