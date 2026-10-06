<?php

namespace Tests\Catalog;

use App\Enums\RoleEnum;
use App\Models\AddonModel;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\User;
use Tests\TestCase;

class AddonTest extends TestCase
{
    private function crearUsuario(RoleEnum $rol): User
    {
        return User::factory()->create([
            User::ROL_ID => $rol->value,
            User::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function otorgarPermiso(int $roleId, string $key): void
    {
        $permission = Permission::where(Permission::KEY, $key)->firstOrFail();

        RolePermission::create([
            RolePermission::TENANT_ID => BusinessConfigModel::first()->id,
            RolePermission::ROLE_ID => $roleId,
            RolePermission::PERMISSION_ID => $permission->id,
        ]);
    }

    private function crearProducto(): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => 'Waffle',
            ProductModel::PRECIO => 60,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    /** PUT /product exige nombre, precio y categoría — se completa el payload con los de $product. */
    private function payloadProducto(ProductModel $product, array $extra = []): array
    {
        return array_merge([
            'nombre' => $product->nombre,
            'precio' => $product->precio,
            'categoria_id' => $product->categoria_id,
        ], $extra);
    }

    private function crearOtroTenant(): BusinessConfigModel
    {
        return BusinessConfigModel::create([
            BusinessConfigModel::SLUG => 'otro-tenant-addons-'.uniqid(),
            BusinessConfigModel::ACTIVO => true,
            BusinessConfigModel::BUSINESS_NAME => 'Otro Tenant',
            BusinessConfigModel::PRIMARY_COLOR => '#F59E0B',
            BusinessConfigModel::SIDEBAR_COLOR => '#1C1917',
            BusinessConfigModel::FONT_COLOR => '#FFFFFF',
            BusinessConfigModel::LABEL_COLOR => '#1C1917',
        ]);
    }

    // ── Index / list / show ──────────────────────────────────

    public function test_lista_complementos_paginada_y_busca_por_nombre(): void
    {
        AddonModel::factory()->create([AddonModel::NAME => 'Nieve']);
        AddonModel::factory()->create([AddonModel::NAME => 'Chocolate']);

        $this->getJson('/api/addon?search=Choco', $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Chocolate');
    }

    public function test_list_solo_devuelve_complementos_activos(): void
    {
        AddonModel::factory()->create([AddonModel::NAME => 'Nieve']);
        AddonModel::factory()->create([AddonModel::NAME => 'Chocolate', AddonModel::IS_ACTIVE => false]);

        $this->getJson('/api/addon/list', $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Nieve');
    }

    public function test_precio_se_serializa_como_numero(): void
    {
        $addon = AddonModel::factory()->create([AddonModel::PRICE => 15]);

        $response = $this->getJson("/api/addon/{$addon->id}", $this->authHeaders())->assertStatus(200);

        $this->assertIsNotString($response->json('data.price'));
        $this->assertEquals(15, $response->json('data.price'));
    }

    // ── Store ────────────────────────────────────────────────

    public function test_admin_crea_complemento(): void
    {
        $this->postJson('/api/addon', [
            'name' => 'Nieve de vainilla',
            'price' => 20,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Nieve de vainilla')
            ->assertJsonPath('data.is_active', true);

        $this->assertDatabaseHas('addons', [
            'name' => 'Nieve de vainilla',
        ]);
    }

    public function test_precio_omitido_queda_en_cero(): void
    {
        $this->postJson('/api/addon', [
            'name' => 'Servilletas',
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.price', 0);
    }

    public function test_valida_nombre_requerido_y_precio_no_negativo(): void
    {
        $this->postJson('/api/addon', [], $this->authHeaders())
            ->assertStatus(400);

        $this->postJson('/api/addon', [
            'name' => 'X', 'price' => -1,
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_nombre_duplicado_en_el_mismo_tenant_falla(): void
    {
        AddonModel::factory()->create([AddonModel::NAME => 'Nieve']);

        $this->postJson('/api/addon', [
            'name' => 'Nieve',
        ], $this->authHeaders())
            ->assertStatus(400);
    }

    public function test_nombre_duplicado_ignora_mayusculas_y_espacios_sobrantes(): void
    {
        AddonModel::factory()->create([AddonModel::NAME => 'Nieve']);

        $this->postJson('/api/addon', ['name' => 'nIeVe'], $this->authHeaders())->assertStatus(400);
        $this->postJson('/api/addon', ['name' => '  Nieve  '], $this->authHeaders())->assertStatus(400);

        $this->assertDatabaseCount('addons', 1);
    }

    public function test_no_permite_renombrar_a_un_nombre_que_ya_existe(): void
    {
        AddonModel::factory()->create([AddonModel::NAME => 'Nieve']);
        $chocolate = AddonModel::factory()->create([AddonModel::NAME => 'Chocolate']);

        $this->putJson("/api/addon/{$chocolate->id}", ['name' => 'NIEVE'], $this->authHeaders())->assertStatus(400);

        $this->assertDatabaseHas('addons', ['id' => $chocolate->id, 'name' => 'Chocolate']);
    }

    public function test_toppings_inactivos_tambien_cuentan_como_existentes(): void
    {
        AddonModel::factory()->create([AddonModel::NAME => 'Nieve', AddonModel::IS_ACTIVE => false]);

        $this->postJson('/api/addon', ['name' => 'Nieve'], $this->authHeaders())->assertStatus(400);
    }

    public function test_mismo_nombre_en_otro_tenant_si_se_permite(): void
    {
        $otroTenant = $this->crearOtroTenant();
        AddonModel::create([
            AddonModel::NAME => 'Nieve',
            AddonModel::TENANT_ID => $otroTenant->id,
        ]);

        $this->postJson('/api/addon', [
            'name' => 'Nieve',
        ], $this->authHeaders())->assertStatus(200);
    }

    // ── Update / delete ──────────────────────────────────────

    public function test_admin_actualiza_complemento(): void
    {
        $addon = AddonModel::factory()->create([AddonModel::NAME => 'Nieve', AddonModel::PRICE => 10]);

        $this->putJson("/api/addon/{$addon->id}", [
            'price' => 25,
            'is_active' => false,
        ], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.price', 25)
            ->assertJsonPath('data.is_active', false);
    }

    public function test_actualizar_conservando_su_propio_nombre_no_choca_con_unique(): void
    {
        $addon = AddonModel::factory()->create([AddonModel::NAME => 'Nieve']);

        $this->putJson("/api/addon/{$addon->id}", ['name' => 'Nieve'], $this->authHeaders())
            ->assertStatus(200);
    }

    public function test_admin_elimina_complemento_con_soft_delete(): void
    {
        $addon = AddonModel::factory()->create();

        $this->deleteJson("/api/addon/{$addon->id}", [], $this->authHeaders())->assertStatus(200);

        $this->assertSoftDeleted('addons', ['id' => $addon->id]);
    }

    public function test_nombre_de_complemento_eliminado_puede_reutilizarse(): void
    {
        $addon = AddonModel::factory()->create([AddonModel::NAME => 'Nieve']);
        $addon->delete();

        $this->postJson('/api/addon', [
            'name' => 'Nieve',
        ], $this->authHeaders())->assertStatus(200);
    }

    // ── Aislamiento entre tenants ────────────────────────────

    public function test_no_ve_ni_modifica_complementos_de_otro_tenant(): void
    {
        $otroTenant = $this->crearOtroTenant();
        $ajeno = AddonModel::create([
            AddonModel::NAME => 'Ajeno',
            AddonModel::TENANT_ID => $otroTenant->id,
        ]);

        $this->getJson("/api/addon/{$ajeno->id}", $this->authHeaders())->assertStatus(404);
        $this->putJson("/api/addon/{$ajeno->id}", ['price' => 99], $this->authHeaders())->assertStatus(404);
        $this->deleteJson("/api/addon/{$ajeno->id}", [], $this->authHeaders())->assertStatus(404);
        $this->getJson('/api/addon/list', $this->authHeaders())->assertJsonCount(0, 'data');
    }

    // ── Autorización ─────────────────────────────────────────

    public function test_rol_no_admin_no_puede_escribir_aunque_tenga_permiso_de_lectura(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'takeOrder');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $addon = AddonModel::factory()->create();

        $this->postJson('/api/addon', [
            'name' => 'Nuevo',
        ], $this->authHeaders($empleado))->assertStatus(403);
        $this->putJson("/api/addon/{$addon->id}", ['price' => 1], $this->authHeaders($empleado))->assertStatus(403);
        $this->deleteJson("/api/addon/{$addon->id}", [], $this->authHeaders($empleado))->assertStatus(403);
    }

    public function test_take_order_puede_leer_el_catalogo(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'takeOrder');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);

        $this->getJson('/api/addon/list', $this->authHeaders($empleado))->assertStatus(200);
    }

    public function test_view_orders_puede_leer_el_catalogo(): void
    {
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'viewOrders');
        $caja = $this->crearUsuario(RoleEnum::CAJA);

        $this->getJson('/api/addon/list', $this->authHeaders($caja))->assertStatus(200);
    }

    public function test_view_products_puede_leer_el_catalogo(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewProducts');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);

        $this->getJson('/api/addon', $this->authHeaders($empleado))->assertStatus(206);
    }

    public function test_rol_con_otro_permiso_no_puede_leer_el_catalogo(): void
    {
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'payOrder');
        $caja = $this->crearUsuario(RoleEnum::CAJA);

        $this->getJson('/api/addon/list', $this->authHeaders($caja))->assertStatus(403);
    }

    public function test_sin_autenticacion_no_accede(): void
    {
        $this->getJson('/api/addon/list')->assertStatus(401);
    }

    // ── Asignación a productos (addon_ids) ───────────────────

    public function test_crear_producto_con_addon_ids_los_asigna(): void
    {
        $nieve = AddonModel::factory()->create([AddonModel::NAME => 'Nieve']);
        $chocolate = AddonModel::factory()->create([AddonModel::NAME => 'Chocolate']);

        $response = $this->postJson('/api/product', [
            'nombre' => 'Waffle clásico',
            'precio' => 65,
            'categoria_id' => CategoryModel::first()->id,
            'addon_ids' => [$nieve->id, $chocolate->id],
        ], $this->authHeaders())->assertStatus(200);

        $this->assertCount(2, $response->json('data.addons'));
        $this->assertDatabaseHas('addon_product', [
            'addon_id' => $nieve->id,
            'product_id' => $response->json('data.id'),
            'tenant_id' => BusinessConfigModel::first()->id,
        ]);
    }

    public function test_actualizar_producto_sincroniza_addon_ids(): void
    {
        $product = $this->crearProducto();
        $nieve = AddonModel::factory()->create([AddonModel::NAME => 'Nieve']);
        $chocolate = AddonModel::factory()->create([AddonModel::NAME => 'Chocolate']);
        $product->addons()->sync([$nieve->id => [ProductModel::TENANT_ID => $product->tenant_id]]);

        $this->putJson("/api/product/{$product->id}", $this->payloadProducto($product, ['addon_ids' => [$chocolate->id]]), $this->authHeaders())->assertStatus(200);

        $this->assertDatabaseMissing('addon_product', ['addon_id' => $nieve->id, 'product_id' => $product->id]);
        $this->assertDatabaseHas('addon_product', ['addon_id' => $chocolate->id, 'product_id' => $product->id]);
    }

    public function test_actualizar_producto_sin_addon_ids_no_toca_las_asignaciones(): void
    {
        $product = $this->crearProducto();
        $nieve = AddonModel::factory()->create();
        $product->addons()->sync([$nieve->id => [ProductModel::TENANT_ID => $product->tenant_id]]);

        $this->putJson("/api/product/{$product->id}", $this->payloadProducto($product, ['nombre' => 'Waffle renombrado']), $this->authHeaders())
            ->assertStatus(200);

        $this->assertDatabaseHas('addon_product', ['addon_id' => $nieve->id, 'product_id' => $product->id]);
    }

    public function test_addon_ids_vacio_quita_todas_las_asignaciones(): void
    {
        $product = $this->crearProducto();
        $nieve = AddonModel::factory()->create();
        $product->addons()->sync([$nieve->id => [ProductModel::TENANT_ID => $product->tenant_id]]);

        $this->putJson("/api/product/{$product->id}", $this->payloadProducto($product, ['addon_ids' => []]), $this->authHeaders())
            ->assertStatus(200);

        $this->assertDatabaseMissing('addon_product', ['product_id' => $product->id]);
    }

    public function test_no_permite_asignar_complemento_de_otro_tenant(): void
    {
        $product = $this->crearProducto();
        $otroTenant = $this->crearOtroTenant();
        $ajeno = AddonModel::create([
            AddonModel::NAME => 'Ajeno',
            AddonModel::TENANT_ID => $otroTenant->id,
        ]);

        $this->putJson("/api/product/{$product->id}", $this->payloadProducto($product, ['addon_ids' => [$ajeno->id]]), $this->authHeaders())
            ->assertStatus(400);

        $this->assertDatabaseMissing('addon_product', ['addon_id' => $ajeno->id]);
    }

    public function test_complemento_eliminado_no_aparece_en_el_producto(): void
    {
        $product = $this->crearProducto();
        $nieve = AddonModel::factory()->create();
        $product->addons()->sync([$nieve->id => [ProductModel::TENANT_ID => $product->tenant_id]]);
        $nieve->delete();

        $this->getJson("/api/product/{$product->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonCount(0, 'data.addons');
    }

    public function test_listado_de_productos_incluye_sus_complementos(): void
    {
        $product = $this->crearProducto();
        $nieve = AddonModel::factory()->create([AddonModel::NAME => 'Nieve']);
        $product->addons()->sync([$nieve->id => [ProductModel::TENANT_ID => $product->tenant_id]]);

        $response = $this->getJson('/api/product?limit=100', $this->authHeaders())->assertStatus(206);

        $row = collect($response->json('data'))->firstWhere('id', $product->id);
        $this->assertSame('Nieve', $row['addons'][0]['name']);
    }

    // ── Asignación masiva desde el catálogo (PUT /addon/{id}/products) ──

    private function crearProductoNombrado(string $nombre): ProductModel
    {
        return ProductModel::create([
            ProductModel::NOMBRE => $nombre,
            ProductModel::PRECIO => 50,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    public function test_admin_asigna_un_topping_a_varios_productos(): void
    {
        $addon = AddonModel::factory()->create();
        $a = $this->crearProductoNombrado('Waffle A');
        $b = $this->crearProductoNombrado('Waffle B');

        $this->putJson("/api/addon/{$addon->id}/products", ['product_ids' => [$a->id, $b->id]], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonCount(2, 'data.product_ids');

        $this->assertDatabaseHas('addon_product', [
            'addon_id' => $addon->id,
            'product_id' => $a->id,
            'tenant_id' => BusinessConfigModel::first()->id,
        ]);
        $this->assertDatabaseHas('addon_product', ['addon_id' => $addon->id, 'product_id' => $b->id]);
    }

    public function test_asignacion_masiva_reemplaza_el_conjunto_anterior(): void
    {
        $addon = AddonModel::factory()->create();
        $a = $this->crearProductoNombrado('Waffle A');
        $b = $this->crearProductoNombrado('Waffle B');
        $addon->products()->sync([$a->id => [AddonModel::TENANT_ID => $addon->tenant_id]]);

        $this->putJson("/api/addon/{$addon->id}/products", ['product_ids' => [$b->id]], $this->authHeaders())
            ->assertStatus(200);

        $this->assertDatabaseMissing('addon_product', ['addon_id' => $addon->id, 'product_id' => $a->id]);
        $this->assertDatabaseHas('addon_product', ['addon_id' => $addon->id, 'product_id' => $b->id]);
    }

    public function test_asignacion_masiva_con_lista_vacia_quita_todos_los_productos(): void
    {
        $addon = AddonModel::factory()->create();
        $a = $this->crearProductoNombrado('Waffle A');
        $addon->products()->sync([$a->id => [AddonModel::TENANT_ID => $addon->tenant_id]]);

        $this->putJson("/api/addon/{$addon->id}/products", ['product_ids' => []], $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonCount(0, 'data.product_ids');

        $this->assertDatabaseMissing('addon_product', ['addon_id' => $addon->id]);
    }

    public function test_asignacion_masiva_exige_la_lista_de_productos(): void
    {
        $addon = AddonModel::factory()->create();

        $this->putJson("/api/addon/{$addon->id}/products", [], $this->authHeaders())->assertStatus(400);
    }

    public function test_asignacion_masiva_rechaza_productos_de_otro_tenant(): void
    {
        $addon = AddonModel::factory()->create();
        $otroTenant = $this->crearOtroTenant();
        $ajeno = ProductModel::create([
            ProductModel::NOMBRE => 'Ajeno',
            ProductModel::PRECIO => 10,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
            ProductModel::ACTIVO => true,
            ProductModel::TENANT_ID => $otroTenant->id,
        ]);

        $this->putJson("/api/addon/{$addon->id}/products", ['product_ids' => [$ajeno->id]], $this->authHeaders())
            ->assertStatus(400);

        $this->assertDatabaseMissing('addon_product', ['product_id' => $ajeno->id]);
    }

    public function test_asignacion_masiva_no_aplica_a_topping_de_otro_tenant(): void
    {
        $otroTenant = $this->crearOtroTenant();
        $ajeno = AddonModel::create([
            AddonModel::NAME => 'Ajeno',
            AddonModel::TENANT_ID => $otroTenant->id,
        ]);

        $this->putJson("/api/addon/{$ajeno->id}/products", ['product_ids' => []], $this->authHeaders())
            ->assertStatus(404);
    }

    public function test_rol_no_admin_no_puede_asignar_productos_masivamente(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'takeOrder');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $addon = AddonModel::factory()->create();

        $this->putJson("/api/addon/{$addon->id}/products", ['product_ids' => []], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_show_devuelve_los_ids_de_productos_asignados(): void
    {
        $addon = AddonModel::factory()->create();
        $a = $this->crearProductoNombrado('Waffle A');
        $addon->products()->sync([$a->id => [AddonModel::TENANT_ID => $addon->tenant_id]]);

        $this->getJson("/api/addon/{$addon->id}", $this->authHeaders())
            ->assertStatus(200)
            ->assertJsonPath('data.product_ids.0', $a->id);
    }

    public function test_index_incluye_products_count(): void
    {
        $addon = AddonModel::factory()->create();
        $a = $this->crearProductoNombrado('Waffle A');
        $b = $this->crearProductoNombrado('Waffle B');
        $addon->products()->sync([
            $a->id => [AddonModel::TENANT_ID => $addon->tenant_id],
            $b->id => [AddonModel::TENANT_ID => $addon->tenant_id],
        ]);

        $this->getJson('/api/addon', $this->authHeaders())
            ->assertStatus(206)
            ->assertJsonPath('data.0.products_count', 2);
    }
}
