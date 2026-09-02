<?php

namespace Tests\Security;

use App\Enums\MainOrderStatusEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\User;
use Tests\TestCase;

/**
 * Reproduce el flujo real de alta de un cliente nuevo — el que dejó a un tenant real en
 * producción ("Chucherias") sin ninguna fila en role_permissions: SuperAdmin crea el tenant
 * (POST /api/super-admin/tenant, que NO siembra permisos) y el Admin de ese tenant da de alta
 * su propio staff vía POST /api/admin/users (que tampoco toca role_permissions) — sin que nadie
 * pase por "Roles y permisos" ni por el botón de seeding de SuperAdmin.
 *
 * Antes del fallback en RolePermissionService::grantedKeys(), este flujo dejaba a Cocina/Caja
 * bloqueados con 403 en cualquier endpoint gateado por PermissionMiddleware. Verifica que ahora
 * heredan los DEFAULTS automáticamente, y que un Admin que sí configura el rol explícitamente
 * (incluso a cero permisos) sigue teniendo la última palabra.
 */
class NewTenantPermissionsFallbackTest extends TestCase
{
    private function crearTenantNuevo(): array
    {
        $payload = [
            'slug' => 'tenant-nuevo-'.uniqid(),
            'business_name' => 'Negocio Nuevo',
            'primary_color' => '#F59E0B',
            'sidebar_color' => '#1C1917',
            'font_color' => '#FFFFFF',
            'label_color' => '#1C1917',
            'admin_nombre' => 'Admin',
            'admin_apellido' => 'Nuevo',
            'admin_email' => 'admin-nuevo-'.uniqid().'@test.com',
            'admin_usuario' => 'admin-nuevo-'.uniqid(),
            'admin_password' => 'password123',
        ];

        $superAdmin = User::where('rol_id', RoleEnum::SUPERADMIN->value)->first();

        $response = $this->postJson('/api/super-admin/tenant', $payload, $this->authHeaders($superAdmin))
            ->assertStatus(200);

        $tenant = BusinessConfigModel::find($response->json('data.id'));
        $admin = User::where(User::TENANT_ID, $tenant->id)->where(User::ROL_ID, RoleEnum::ADMIN->value)->first();

        return [$tenant, $admin];
    }

    private function crearStaffComoAdminDelTenant(User $admin, RoleEnum $rol): User
    {
        $response = $this->postJson('/api/admin/users', [
            'nombre' => $rol->name,
            'apellido_paterno' => 'Staff',
            'email' => strtolower($rol->name).'-'.uniqid().'@test.com',
            'usuario' => strtolower($rol->name).'-'.uniqid(),
            'password' => 'Password123',
            'rol_id' => $rol->value,
        ], $this->authHeaders($admin))->assertStatus(200);

        return User::find($response->json('data.id'));
    }

    public function test_tenant_nuevo_no_tiene_ninguna_fila_de_role_permissions(): void
    {
        [$tenant] = $this->crearTenantNuevo();

        $this->assertDatabaseMissing('role_permissions', [
            'tenant_id' => $tenant->id,
        ]);
        $this->assertDatabaseMissing('role_permission_configs', [
            'tenant_id' => $tenant->id,
        ]);
    }

    public function test_cocina_de_tenant_nuevo_creada_por_su_admin_puede_marcar_producto_listo(): void
    {
        [$tenant, $admin] = $this->crearTenantNuevo();
        $cocina = $this->crearStaffComoAdminDelTenant($admin, RoleEnum::COCINA);

        $sistema = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN->value,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => $admin->id,
            MainOrderReportModel::TENANT_ID => $tenant->id,
        ]);
        $orden = OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Mesa 1',
            OrderModel::SISTEMA_ID => $sistema->id,
            OrderModel::TENANT_ID => $tenant->id,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
        ]);
        $item = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::NOMBRE_EXTRA => 'Extra',
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 10,
            OrderProductModel::DESCUENTO => 0,
        ]);

        // Sin este fix, esto regresaba 403: Cocina no tenía ninguna fila en role_permissions.
        $this->patchJson("/api/order/{$orden->id}/product/{$item->id}/ready", [], $this->authHeaders($cocina))
            ->assertStatus(200);
    }

    public function test_caja_de_tenant_nuevo_creada_por_su_admin_puede_cerrar_una_orden(): void
    {
        [$tenant, $admin] = $this->crearTenantNuevo();
        $caja = $this->crearStaffComoAdminDelTenant($admin, RoleEnum::CAJA);

        $sistema = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN->value,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => $admin->id,
            MainOrderReportModel::TENANT_ID => $tenant->id,
        ]);
        $orden = OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Mesa 1',
            OrderModel::SISTEMA_ID => $sistema->id,
            OrderModel::TENANT_ID => $tenant->id,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
        ]);

        // Sin este fix, esto regresaba 403: Caja no tenía ninguna fila en role_permissions.
        $this->putJson("/api/order/{$orden->id}", [
            'estatus_pedido_id' => OrderStatusEnum::CLOSED->value,
        ], $this->authHeaders($caja))->assertStatus(200);
    }

    public function test_admin_del_tenant_nuevo_puede_restringir_cocina_explicitamente_a_cero_permisos(): void
    {
        [, $admin] = $this->crearTenantNuevo();
        $cocina = $this->crearStaffComoAdminDelTenant($admin, RoleEnum::COCINA);

        // El Admin abre "Roles y permisos" y deja Cocina sin ningún permiso a propósito —
        // el marcador role_permission_configs debe impedir que el fallback a DEFAULTS lo revierta.
        $this->putJson('/api/admin/role-permissions/'.RoleEnum::COCINA->value, [
            'permissions' => [],
        ], $this->authHeaders($admin))->assertStatus(200);

        $sistema = MainOrderReportModel::create([
            MainOrderReportModel::ESTATUS_CAJA => MainOrderStatusEnum::OPEN->value,
            MainOrderReportModel::EFECTIVO_CAJA_INICIO => 0,
            MainOrderReportModel::USER_ID => $admin->id,
            MainOrderReportModel::TENANT_ID => $admin->tenant_id,
        ]);
        $orden = OrderModel::create([
            OrderModel::NOMBRE_PEDIDO => 'Mesa 1',
            OrderModel::SISTEMA_ID => $sistema->id,
            OrderModel::TENANT_ID => $admin->tenant_id,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            OrderModel::TOTAL => 0,
            OrderModel::SUBTOTAL => 0,
        ]);
        $item = OrderProductModel::create([
            OrderProductModel::PEDIDO_ID => $orden->id,
            OrderProductModel::NOMBRE_EXTRA => 'Extra',
            OrderProductModel::CANTIDAD => 1,
            OrderProductModel::PRECIO => 10,
            OrderProductModel::DESCUENTO => 0,
        ]);

        $this->patchJson("/api/order/{$orden->id}/product/{$item->id}/ready", [], $this->authHeaders($cocina))
            ->assertStatus(403);
    }
}
