<?php

namespace Tests\Security;

use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BranchModel;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\User;
use Tests\TestCase;

/**
 * Cubre la Fase 2 del feature de sucursales: apertura/cierre de caja y alta de productos
 * ya conectados a branch_id. Dos ejes de riesgo:
 * 1) un tenant SIN multi_branch_enabled debe seguir funcionando exactamente igual que
 *    antes de esta feature (branch_id nunca requerido, una sola caja global por tenant).
 * 2) un tenant CON multi_branch_enabled permite una caja abierta por sucursal en
 *    paralelo, pero un usuario solo puede operar/ver las sucursales que tiene otorgadas.
 */
class BranchScopedOperationsTest extends TestCase
{
    private function tenantId(): int
    {
        return BusinessConfigModel::first()->id;
    }

    private function admin(): User
    {
        return User::where('rol_id', RoleEnum::ADMIN->value)->first();
    }

    private function crearUsuario(RoleEnum $rol): User
    {
        return User::factory()->create([
            User::ROL_ID => $rol->value,
            User::TENANT_ID => $this->tenantId(),
        ]);
    }

    private function habilitarMultiSucursal(): void
    {
        BusinessConfigModel::find($this->tenantId())
            ->update([BusinessConfigModel::MULTI_BRANCH_ENABLED => true]);
    }

    private function crearSucursal(string $name): BranchModel
    {
        return BranchModel::create([
            BranchModel::NAME => $name,
            BranchModel::TENANT_ID => $this->tenantId(),
            BranchModel::ACTIVE => true,
        ]);
    }

    private function otorgarPermiso(int $roleId, string $key): void
    {
        $permission = Permission::where(Permission::KEY, $key)->firstOrFail();

        RolePermission::create([
            RolePermission::TENANT_ID => $this->tenantId(),
            RolePermission::ROLE_ID => $roleId,
            RolePermission::PERMISSION_ID => $permission->id,
        ]);
    }

    private function crearOrdenEnSucursal(int $branchId): OrderModel
    {
        $sistema = MainOrderReportModel::openSales(100, $this->admin()->id, '', $branchId);

        return OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Mesa 1',
            OrderModel::SISTEMA_ID => $sistema->id,
            OrderModel::TENANT_ID => $this->tenantId(),
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
        ]);
    }

    // ── Tenant SIN multi_branch_enabled — sin regresión ──────────

    public function test_tenant_sin_sucursales_abre_caja_sin_branch_id(): void
    {
        $admin = $this->admin();

        $this->postJson('/api/admin/system/open', [
            'user_id' => $admin->id,
            'efectivo_caja_inicio' => 100,
        ], $this->authHeaders($admin))->assertStatus(200);

        $this->assertDatabaseHas('main_order_report', [
            'user_id' => $admin->id,
            'branch_id' => null,
        ]);
    }

    public function test_tenant_sin_sucursales_solo_permite_una_caja_abierta(): void
    {
        $admin = $this->admin();

        MainOrderReportModel::openSales(100, $admin->id);

        $this->postJson('/api/admin/system/open', [
            'user_id' => $admin->id,
            'efectivo_caja_inicio' => 50,
        ], $this->authHeaders($admin))->assertJsonPath('status', 'error');
    }

    public function test_tenant_sin_sucursales_crea_producto_sin_branch_id(): void
    {
        $admin = $this->admin();
        $categoria = CategoryModel::first();

        $response = $this->postJson('/api/product', [
            'nombre' => 'Producto Sin Sucursal',
            'precio' => 10,
            'categoria_id' => $categoria->id,
        ], $this->authHeaders($admin))->assertStatus(200);

        $this->assertDatabaseHas('product', ['nombre' => 'Producto Sin Sucursal']);
        $this->assertDatabaseMissing('product_branch', ['product_id' => $response->json('data.id')]);
    }

    // ── POST /order — no se puede crear una orden en la caja de una
    //    sucursal a la que el usuario no tiene acceso (ValidatesOpenSistema) ──

    public function test_empleado_sin_acceso_no_puede_crear_orden_en_caja_de_otra_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('Ajena');
        $sistema = MainOrderReportModel::openSales(100, $this->admin()->id, '', $sucursal->id);
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'takeOrder');

        $this->postJson('/api/order', [
            'nombre_pedido' => 'Mesa 1',
            'total' => 0,
            'subtotal' => 0,
            'sistema_id' => $sistema->id,
            'estatus_pedido_id' => OrderStatusEnum::IN_PROCESS->value,
        ], $this->authHeaders($empleado))->assertStatus(400);

        $this->assertDatabaseMissing('order', ['sistema_id' => $sistema->id]);
    }

    public function test_empleado_con_acceso_puede_crear_orden_en_su_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('Propia');
        $sistema = MainOrderReportModel::openSales(100, $this->admin()->id, '', $sucursal->id);
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $sucursal->users()->attach($empleado->id, [BranchModel::TENANT_ID => $this->tenantId()]);
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'takeOrder');

        $this->postJson('/api/order', [
            'nombre_pedido' => 'Mesa 1',
            'total' => 0,
            'subtotal' => 0,
            'sistema_id' => $sistema->id,
            'estatus_pedido_id' => OrderStatusEnum::IN_PROCESS->value,
        ], $this->authHeaders($empleado))->assertStatus(200);

        $this->assertDatabaseHas('order', ['sistema_id' => $sistema->id]);
    }

    public function test_admin_puede_crear_orden_en_caja_de_cualquier_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('Cualquiera');
        $sistema = MainOrderReportModel::openSales(100, $this->admin()->id, '', $sucursal->id);

        $this->postJson('/api/order', [
            'nombre_pedido' => 'Mesa 1',
            'total' => 0,
            'subtotal' => 0,
            'sistema_id' => $sistema->id,
            'estatus_pedido_id' => OrderStatusEnum::IN_PROCESS->value,
        ], $this->authHeaders($this->admin()))->assertStatus(200);
    }

    // ── Tenant CON multi_branch_enabled ──────────────────────────

    public function test_dos_sucursales_abren_caja_en_paralelo(): void
    {
        $this->habilitarMultiSucursal();
        $sucursalA = $this->crearSucursal('A');
        $sucursalB = $this->crearSucursal('B');
        $admin = $this->admin();

        $this->postJson('/api/admin/system/open', [
            'user_id' => $admin->id,
            'efectivo_caja_inicio' => 100,
            'branch_id' => $sucursalA->id,
        ], $this->authHeaders($admin))->assertStatus(200);

        $this->postJson('/api/admin/system/open', [
            'user_id' => $admin->id,
            'efectivo_caja_inicio' => 100,
            'branch_id' => $sucursalB->id,
        ], $this->authHeaders($admin))->assertStatus(200);

        $this->assertDatabaseHas('main_order_report', ['branch_id' => $sucursalA->id]);
        $this->assertDatabaseHas('main_order_report', ['branch_id' => $sucursalB->id]);
    }

    public function test_misma_sucursal_no_permite_dos_cajas_abiertas(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $admin = $this->admin();

        MainOrderReportModel::openSales(100, $admin->id, '', $sucursal->id);

        $this->postJson('/api/admin/system/open', [
            'user_id' => $admin->id,
            'efectivo_caja_inicio' => 50,
            'branch_id' => $sucursal->id,
        ], $this->authHeaders($admin))->assertJsonPath('status', 'error');
    }

    public function test_branch_id_requerido_al_abrir_caja_si_tenant_tiene_multisucursal(): void
    {
        $this->habilitarMultiSucursal();
        $admin = $this->admin();

        $this->postJson('/api/admin/system/open', [
            'user_id' => $admin->id,
            'efectivo_caja_inicio' => 100,
        ], $this->authHeaders($admin))->assertStatus(400);
    }

    public function test_empleado_sin_acceso_a_sucursal_no_puede_abrir_su_caja(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);

        $this->postJson('/api/admin/system/open', [
            'user_id' => $empleado->id,
            'efectivo_caja_inicio' => 100,
            'branch_id' => $sucursal->id,
        ], $this->authHeaders($empleado))->assertStatus(403);
    }

    public function test_empleado_con_acceso_a_sucursal_puede_abrir_su_caja(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $sucursal->users()->attach($empleado->id, [BranchModel::TENANT_ID => $this->tenantId()]);

        $this->postJson('/api/admin/system/open', [
            'user_id' => $empleado->id,
            'efectivo_caja_inicio' => 100,
            'branch_id' => $sucursal->id,
        ], $this->authHeaders($empleado))->assertStatus(200);
    }

    public function test_empleado_sin_acceso_no_puede_ver_caja_de_otra_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $admin = $this->admin();
        $caja = MainOrderReportModel::openSales(100, $admin->id, '', $sucursal->id);
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);

        $this->getJson("/api/admin/system/{$caja->id}", $this->authHeaders($empleado))
            ->assertStatus(403);

        $this->postJson("/api/admin/system/{$caja->id}/close", [], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_producto_se_crea_con_branch_ids_validos(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $admin = $this->admin();
        $categoria = CategoryModel::first();

        $response = $this->postJson('/api/product', [
            'nombre' => 'Producto Con Branch',
            'precio' => 10,
            'categoria_id' => $categoria->id,
            'branch_ids' => [$sucursal->id],
        ], $this->authHeaders($admin))->assertStatus(200);

        $productId = $response->json('data.id');
        $this->assertDatabaseHas('product_branch', [
            'product_id' => $productId,
            'branch_id' => $sucursal->id,
            'tenant_id' => $this->tenantId(),
        ]);
    }

    public function test_empleado_no_puede_crear_producto_en_sucursal_sin_acceso(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $categoria = CategoryModel::first();

        $this->postJson('/api/product', [
            'nombre' => 'Producto Prohibido',
            'precio' => 10,
            'categoria_id' => $categoria->id,
            'branch_ids' => [$sucursal->id],
        ], $this->authHeaders($empleado))->assertStatus(403);
    }

    public function test_producto_sin_branch_ids_queda_disponible_en_todas_las_sucursales(): void
    {
        $this->habilitarMultiSucursal();
        $this->crearSucursal('A');
        $admin = $this->admin();
        $categoria = CategoryModel::first();

        $response = $this->postJson('/api/product', [
            'nombre' => 'Producto Sin Branch Ids',
            'precio' => 10,
            'categoria_id' => $categoria->id,
        ], $this->authHeaders($admin))->assertStatus(200);

        $productId = $response->json('data.id');
        $this->assertDatabaseCount('product_branch', 0);
        $this->assertDatabaseHas('product', ['id' => $productId, 'nombre' => 'Producto Sin Branch Ids']);
    }

    public function test_actualizar_producto_reemplaza_el_set_de_sucursales_no_lo_acumula(): void
    {
        $this->habilitarMultiSucursal();
        $sucursalA = $this->crearSucursal('A');
        $sucursalB = $this->crearSucursal('B');
        $admin = $this->admin();
        $categoria = CategoryModel::first();
        $producto = ProductModel::factory()->create([
            ProductModel::TENANT_ID => $this->tenantId(),
            ProductModel::CATEGORIA_ID => $categoria->id,
        ]);
        $producto->branches()->attach($sucursalA->id, [ProductModel::TENANT_ID => $this->tenantId()]);

        $this->putJson("/api/product/{$producto->id}", [
            'nombre' => $producto->nombre,
            'precio' => $producto->precio,
            'categoria_id' => $categoria->id,
            'branch_ids' => [$sucursalB->id],
        ], $this->authHeaders($admin))->assertStatus(200);

        $this->assertDatabaseMissing('product_branch', ['product_id' => $producto->id, 'branch_id' => $sucursalA->id]);
        $this->assertDatabaseHas('product_branch', ['product_id' => $producto->id, 'branch_id' => $sucursalB->id]);
    }

    public function test_actualizar_producto_con_branch_ids_vacio_lo_deja_disponible_en_todas(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $admin = $this->admin();
        $categoria = CategoryModel::first();
        $producto = ProductModel::factory()->create([
            ProductModel::TENANT_ID => $this->tenantId(),
            ProductModel::CATEGORIA_ID => $categoria->id,
        ]);
        $producto->branches()->attach($sucursal->id, [ProductModel::TENANT_ID => $this->tenantId()]);

        $this->putJson("/api/product/{$producto->id}", [
            'nombre' => $producto->nombre,
            'precio' => $producto->precio,
            'categoria_id' => $categoria->id,
            'branch_ids' => [],
        ], $this->authHeaders($admin))->assertStatus(200);

        $this->assertDatabaseCount('product_branch', 0);
    }

    public function test_producto_sin_sucursales_esta_disponible_en_cualquier_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('A');
        $producto = ProductModel::factory()->create([
            ProductModel::TENANT_ID => $this->tenantId(),
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
        ]);

        $this->assertTrue($producto->isAvailableInBranch($sucursal->id));
        $this->assertTrue($producto->isAvailableInBranch(null));
    }

    public function test_producto_con_sucursal_asignada_solo_esta_disponible_ahi(): void
    {
        $this->habilitarMultiSucursal();
        $sucursalAsignada = $this->crearSucursal('Asignada');
        $sucursalOtra = $this->crearSucursal('Otra');
        $producto = ProductModel::factory()->create([
            ProductModel::TENANT_ID => $this->tenantId(),
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
        ]);
        $producto->branches()->attach($sucursalAsignada->id, [ProductModel::TENANT_ID => $this->tenantId()]);

        $this->assertTrue($producto->isAvailableInBranch($sucursalAsignada->id));
        $this->assertFalse($producto->isAvailableInBranch($sucursalOtra->id));
    }

    // ── Sucursal desactivada — no debe aceptar nuevas operaciones ─

    public function test_no_puede_abrir_caja_en_sucursal_desactivada(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('Desactivada');
        $sucursal->update([BranchModel::ACTIVE => false]);
        $admin = $this->admin();

        $this->postJson('/api/admin/system/open', [
            'user_id' => $admin->id,
            'efectivo_caja_inicio' => 100,
            'branch_id' => $sucursal->id,
        ], $this->authHeaders($admin))->assertStatus(400);
    }

    public function test_no_puede_crear_producto_en_sucursal_desactivada(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('Desactivada');
        $sucursal->update([BranchModel::ACTIVE => false]);
        $admin = $this->admin();
        $categoria = CategoryModel::first();

        $this->postJson('/api/product', [
            'nombre' => 'Producto En Sucursal Inactiva',
            'precio' => 10,
            'categoria_id' => $categoria->id,
            'branch_ids' => [$sucursal->id],
        ], $this->authHeaders($admin))->assertStatus(400);
    }

    public function test_no_puede_actualizar_producto_reasignandolo_a_sucursal_desactivada(): void
    {
        $this->habilitarMultiSucursal();
        $sucursalActiva = $this->crearSucursal('Activa');
        $sucursalInactiva = $this->crearSucursal('Desactivada');
        $sucursalInactiva->update([BranchModel::ACTIVE => false]);
        $admin = $this->admin();
        $categoria = CategoryModel::first();
        $producto = ProductModel::factory()->create([
            ProductModel::TENANT_ID => $this->tenantId(),
            ProductModel::CATEGORIA_ID => $categoria->id,
        ]);
        $producto->branches()->attach($sucursalActiva->id, [ProductModel::TENANT_ID => $this->tenantId()]);

        $this->putJson("/api/product/{$producto->id}", [
            'nombre' => $producto->nombre,
            'precio' => $producto->precio,
            'categoria_id' => $categoria->id,
            'branch_ids' => [$sucursalInactiva->id],
        ], $this->authHeaders($admin))->assertStatus(400);
    }

    // ── Mutaciones de orden — no basta con no ver la sucursal en el listado,
    //    el backend debe rechazar la mutación aunque el cliente conozca el ID ──

    public function test_empleado_sin_acceso_no_puede_cerrar_orden_de_otra_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('Ajena');
        $orden = $this->crearOrdenEnSucursal($sucursal->id);
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'payOrder');

        $this->putJson("/api/order/{$orden->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders($empleado))->assertStatus(403);
    }

    public function test_empleado_con_acceso_puede_cerrar_orden_de_su_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('Propia');
        $orden = $this->crearOrdenEnSucursal($sucursal->id);
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $sucursal->users()->attach($empleado->id, [BranchModel::TENANT_ID => $this->tenantId()]);
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'payOrder');

        $this->putJson("/api/order/{$orden->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders($empleado))->assertStatus(200);
    }

    public function test_empleado_sin_acceso_no_puede_eliminar_orden_de_otra_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('Ajena');
        $orden = $this->crearOrdenEnSucursal($sucursal->id);
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'deleteOrder');

        $this->deleteJson("/api/order/{$orden->id}", [], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_empleado_sin_acceso_no_puede_agregar_producto_a_orden_de_otra_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('Ajena');
        $orden = $this->crearOrdenEnSucursal($sucursal->id);
        $empleado = $this->crearUsuario(RoleEnum::EMPLOYE);
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'takeOrder');
        $producto = ProductModel::factory()->create([
            ProductModel::TENANT_ID => $this->tenantId(),
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id,
        ]);

        $this->postJson("/api/order/{$orden->id}/product", [
            'producto_id' => $producto->id,
            'cantidad' => 1,
            'precio' => $producto->precio,
        ], $this->authHeaders($empleado))->assertStatus(403);
    }

    public function test_admin_puede_operar_ordenes_de_cualquier_sucursal(): void
    {
        $this->habilitarMultiSucursal();
        $sucursal = $this->crearSucursal('Cualquiera');
        $orden = $this->crearOrdenEnSucursal($sucursal->id);

        $this->putJson("/api/order/{$orden->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders($this->admin()))->assertStatus(200);
    }
}
