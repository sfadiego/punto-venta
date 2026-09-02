<?php

namespace Tests\Security;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\CategoryModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\Permission;
use App\Models\ProductModel;
use App\Models\RolePermission;
use App\Models\User;
use Tests\TestCase;

/**
 * Cubre el hallazgo de la auditoría: orders.php/products.php no tenían middleware de
 * rol/permiso, permitiendo que cualquier usuario autenticado del tenant (Cocina, Caja)
 * borrara órdenes/productos o ajustara stock. Verifica que el fix (permission:xxx por
 * ruta + autorización por campo en OrderUpdateRequest) no rompa los flujos legítimos de
 * cada rol (Cocina marca listo/servido, Caja cobra, Employee toma pedidos).
 */
class OrderProductAuthorizationTest extends TestCase
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

    private function crearSistema(): MainOrderReportModel
    {
        return MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => User::where('rol_id', RoleEnum::ADMIN->value)->first()->id,
            MainOrderReportModel::TENANT_ID => BusinessConfigModel::first()->id,
        ]);
    }

    private function crearOrden(?int $estatus = null, ?MainOrderReportModel $sistema = null): OrderModel
    {
        $sistema ??= $this->crearSistema();

        return OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Mesa 1',
            OrderModel::SISTEMA_ID => $sistema->id,
            OrderModel::TENANT_ID => BusinessConfigModel::first()->id,
            OrderModel::ESTATUS_PEDIDO_ID => $estatus ?? OrderStatusEnum::IN_PROCESS->value,
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
        ]);
    }

    // ── PUT /order/{order} — autorización por campo ─────────────

    public function test_caja_puede_cerrar_una_orden(): void
    {
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'payOrder');
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $orden = $this->crearOrden();

        $this->putJson("/api/order/{$orden->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders($caja))->assertStatus(200);
    }

    public function test_caja_no_puede_renombrar_una_orden(): void
    {
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $orden = $this->crearOrden();

        $this->putJson("/api/order/{$orden->id}", [
            'nombre_pedido' => 'Renombrada por caja',
        ], $this->authHeaders($caja))->assertStatus(403);
    }

    public function test_caja_no_puede_marcar_una_orden_como_servida(): void
    {
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $orden = $this->crearOrden();

        $this->putJson("/api/order/{$orden->id}", [
            'estatus_pedido_id' => OrderStatusEnum::SERVED->value,
        ], $this->authHeaders($caja))->assertStatus(403);
    }

    public function test_cocina_puede_marcar_una_orden_como_servida(): void
    {
        $this->otorgarPermiso(RoleEnum::COCINA->value, 'kitchenView');
        $cocina = $this->crearUsuario(RoleEnum::COCINA);
        $orden = $this->crearOrden();

        $this->putJson("/api/order/{$orden->id}", [
            'estatus_pedido_id' => OrderStatusEnum::SERVED->value,
        ], $this->authHeaders($cocina))->assertStatus(200);
    }

    public function test_cocina_no_puede_cerrar_una_orden(): void
    {
        $cocina = $this->crearUsuario(RoleEnum::COCINA);
        $orden = $this->crearOrden();

        $this->putJson("/api/order/{$orden->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders($cocina))->assertStatus(403);
    }

    public function test_cocina_no_puede_renombrar_una_orden(): void
    {
        $cocina = $this->crearUsuario(RoleEnum::COCINA);
        $orden = $this->crearOrden();

        $this->putJson("/api/order/{$orden->id}", [
            'nombre_pedido' => 'Renombrada por cocina',
        ], $this->authHeaders($cocina))->assertStatus(403);
    }

    public function test_admin_puede_renombrar_cerrar_y_marcar_servida(): void
    {
        $orden = $this->crearOrden();

        $this->putJson("/api/order/{$orden->id}", [
            'nombre_pedido' => 'Renombrada por admin',
        ], $this->authHeaders())->assertStatus(200);
    }

    // ── PATCH .../ready — permission:kitchenView ────────────────

    private function crearItemDeOrden(OrderModel $orden): OrderProductModel
    {
        return OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::NOMBRE_EXTRA => 'Extra',
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 10,
            OrderProductModel::DESCUENTO => 0,
        ]);
    }

    public function test_cocina_puede_marcar_producto_listo(): void
    {
        $this->otorgarPermiso(RoleEnum::COCINA->value, 'kitchenView');
        $cocina = $this->crearUsuario(RoleEnum::COCINA);
        $orden = $this->crearOrden();
        $item = $this->crearItemDeOrden($orden);

        $this->patchJson("/api/order/{$orden->id}/product/{$item->id}/ready", [], $this->authHeaders($cocina))
            ->assertStatus(200);
    }

    public function test_caja_no_puede_marcar_producto_listo(): void
    {
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $orden = $this->crearOrden();
        $item = $this->crearItemDeOrden($orden);

        $this->patchJson("/api/order/{$orden->id}/product/{$item->id}/ready", [], $this->authHeaders($caja))
            ->assertStatus(403);
    }

    // ── Mutaciones de carrito — permission:takeOrder ────────────

    public function test_cocina_sin_role_permissions_configurados_puede_agregar_producto_al_carrito(): void
    {
        // Tenant sin fila alguna en role_permissions para Cocina (nunca se corrió el seeding ni
        // se configuró "Roles y permisos") — RolePermissionService::grantedKeys() cae a DEFAULTS,
        // que para Cocina incluye viewOrders. Debe comportarse como antes del fix, no bloquear.
        $cocina = $this->crearUsuario(RoleEnum::COCINA);
        $orden = $this->crearOrden();

        $this->postJson("/api/order/{$orden->id}/product", [
            'nombre_extra' => 'Extra',
            'cantidad' => 1,
            'precio' => 10,
        ], $this->authHeaders($cocina))->assertStatus(200);
    }

    public function test_cocina_configurada_explicitamente_sin_permisos_no_puede_agregar_producto_al_carrito(): void
    {
        // A diferencia del caso anterior, aquí el tenant SÍ configuró el rol (aunque sea con un
        // permiso ajeno) — ya no aplica el fallback a DEFAULTS, así que sin takeOrder/viewOrders
        // el acceso debe negarse.
        $this->otorgarPermiso(RoleEnum::COCINA->value, 'printTicket');
        $cocina = $this->crearUsuario(RoleEnum::COCINA);
        $orden = $this->crearOrden();

        $this->postJson("/api/order/{$orden->id}/product", [
            'nombre_extra' => 'Extra',
            'cantidad' => 1,
            'precio' => 10,
        ], $this->authHeaders($cocina))->assertStatus(403);
    }

    public function test_caja_sin_role_permissions_configurados_puede_agregar_producto_al_carrito(): void
    {
        // Mismo caso que Cocina: Caja también trae viewOrders en DEFAULTS.
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $orden = $this->crearOrden();

        $this->postJson("/api/order/{$orden->id}/product", [
            'nombre_extra' => 'Extra',
            'cantidad' => 1,
            'precio' => 10,
        ], $this->authHeaders($caja))->assertStatus(200);
    }

    public function test_empleado_si_puede_agregar_producto_al_carrito(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'takeOrder');
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();
        $orden = $this->crearOrden();

        $this->postJson("/api/order/{$orden->id}/product", [
            'nombre_extra' => 'Extra',
            'cantidad' => 1,
            'precio' => 10,
        ], $this->authHeaders($empleado))->assertStatus(200);
    }

    public function test_caja_con_viewOrders_puede_agregar_producto_al_retomar_una_venta(): void
    {
        // QuickSale (venta por peso) retoma una orden en proceso y edita su carrito con
        // estos mismos endpoints — Caja no tiene takeOrder por default, pero sí viewOrders
        // (requerido para entrar a QuickSale), así que el middleware acepta cualquiera de
        // los dos (ver PermissionMiddleware).
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'viewOrders');
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $orden = $this->crearOrden();

        $this->postJson("/api/order/{$orden->id}/product", [
            'nombre_extra' => 'Extra',
            'cantidad' => 1,
            'precio' => 10,
        ], $this->authHeaders($caja))->assertStatus(200);
    }

    public function test_caja_configurada_explicitamente_sin_permisos_no_puede_vaciar_el_carrito(): void
    {
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'printTicket');
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $orden = $this->crearOrden();

        $this->deleteJson("/api/order/{$orden->id}/clear-cart", [], $this->authHeaders($caja))
            ->assertStatus(403);
    }

    // ── DELETE /order/{order} — permission:deleteOrder ──────────

    public function test_empleado_no_puede_borrar_una_orden_sin_el_permiso(): void
    {
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();
        $orden = $this->crearOrden();

        $this->deleteJson("/api/order/{$orden->id}", [], $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_empleado_con_permiso_deleteorder_si_puede_borrar_una_orden(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'deleteOrder');
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();
        $orden = $this->crearOrden();

        $this->deleteJson("/api/order/{$orden->id}", [], $this->authHeaders($empleado))
            ->assertStatus(200);
    }

    // ── Reportes — permission:viewSales / viewCloseSales ────────

    public function test_empleado_no_ve_reporte_de_ventas_por_categoria(): void
    {
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();
        $sistema = $this->crearSistema();

        $this->getJson("/api/order/sales-by-category?sistema_id={$sistema->id}", $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    public function test_empleado_con_permiso_viewsales_si_ve_reporte_de_ventas_por_categoria(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewSales');
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();
        $sistema = $this->crearSistema();

        $this->getJson("/api/order/sales-by-category?sistema_id={$sistema->id}", $this->authHeaders($empleado))
            ->assertStatus(200);
    }

    public function test_empleado_no_ve_clientes_a_credito_de_la_sesion(): void
    {
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();
        $sistema = $this->crearSistema();

        $this->getJson("/api/order/credit-customers?sistema_id={$sistema->id}", $this->authHeaders($empleado))
            ->assertStatus(403);
    }

    // ── Venta directa — permission:viewOrders (todos los roles la tienen) ─

    public function test_caja_si_puede_hacer_venta_directa(): void
    {
        $this->otorgarPermiso(RoleEnum::CAJA->value, 'viewOrders');
        $caja = $this->crearUsuario(RoleEnum::CAJA);
        $sistema = $this->crearSistema();
        $producto = ProductModel::create([
            ProductModel::NOMBRE => 'Producto', ProductModel::PRECIO => 20,
            ProductModel::CATEGORIA_ID => CategoryModel::first()->id, ProductModel::ACTIVO => true,
        ]);

        $this->postJson('/api/order/sale', [
            'sistema_id' => $sistema->id,
            'nombre_pedido' => 'Venta mostrador',
            'items' => [['producto_id' => $producto->id, 'cantidad' => 1]],
        ], $this->authHeaders($caja))->assertStatus(200);
    }

    // ── Productos — permission:viewProducts ─────────────────────

    public function test_caja_no_ve_catalogo_de_productos(): void
    {
        $caja = $this->crearUsuario(RoleEnum::CAJA);

        $this->getJson('/api/product', $this->authHeaders($caja))
            ->assertStatus(403);
    }

    public function test_empleado_si_ve_catalogo_de_productos(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewProducts');
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();

        $this->getJson('/api/product', $this->authHeaders($empleado))
            ->assertStatus(206);
    }

    public function test_caja_no_puede_crear_producto(): void
    {
        $caja = $this->crearUsuario(RoleEnum::CAJA);

        $this->postJson('/api/product', [
            'nombre' => 'Producto intruso',
            'precio' => 10,
            'categoria_id' => CategoryModel::first()->id,
        ], $this->authHeaders($caja))->assertStatus(403);
    }

    public function test_empleado_si_puede_crear_producto(): void
    {
        $this->otorgarPermiso(RoleEnum::EMPLOYE->value, 'viewProducts');
        $empleado = User::where('rol_id', RoleEnum::EMPLOYE->value)->first();

        $this->postJson('/api/product', [
            'nombre' => 'Producto nuevo',
            'precio' => 10,
            'categoria_id' => CategoryModel::first()->id,
        ], $this->authHeaders($empleado))->assertStatus(200);
    }
}
