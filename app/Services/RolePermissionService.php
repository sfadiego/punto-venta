<?php

namespace App\Services;

use App\Enums\RoleEnum;
use App\Models\BusinessConfigModel;
use App\Models\Permission;
use App\Models\RolePermission;
use App\Models\RolePermissionConfig;
use Illuminate\Support\Collection;

class RolePermissionService
{
    // Roles configurables por el Admin — Admin/SuperAdmin siempre tienen bypass total en frontend.
    private const CONFIGURABLE_ROLES = [RoleEnum::EMPLOYE, RoleEnum::COCINA, RoleEnum::CAJA];

    // Debe reflejar los defaults de resources/js/utils/permissionUtils.ts (DEFAULT_ROLE_PERMISSIONS).
    private const DEFAULTS = [
        RoleEnum::EMPLOYE->value => [
            'viewDashboard', 'viewOrders', 'viewProducts', 'takeOrder',
            'editOrderName', 'printTicket', 'kitchenView', 'payOrder',
        ],
        RoleEnum::COCINA->value => [
            'viewDashboard', 'viewOrders', 'kitchenView', 'printTicket',
        ],
        RoleEnum::CAJA->value => [
            'viewDashboard', 'viewOrders', 'payOrder', 'printTicket', 'registerExpense',
        ],
    ];

    /**
     * DEFAULTS filtrado por lo que el tipo de negocio del tenant realmente soporta — un tenant
     * sin cocina (venta_por_peso, retail) nunca debe recibir 'kitchenView' como default para
     * Employe/Cocina, aunque el rol Cocina en sí ya esté excluido para esos tipos
     * (validateRoleConfigurable/excludesCocinaCajaRoles no cubre esto: ahí solo se bloquea que
     * el rol se ASIGNE, esto evita que la clave de permiso exista de origen).
     */
    private function defaultsForTenant(int $tenantId): array
    {
        $hasKitchen = BusinessConfigModel::find($tenantId)?->tipo_negocio?->features()['kitchen_view'] ?? true;

        if ($hasKitchen) {
            return self::DEFAULTS;
        }

        return array_map(
            fn (array $keys) => array_values(array_diff($keys, ['kitchenView'])),
            self::DEFAULTS,
        );
    }

    /**
     * Usado en login: corre antes de que ResolveTenant bindee tenant_id, así que recibe el tenant
     * explícito. Siempre incluye los 3 roles configurables (con array vacío si no tienen grants)
     * para que el frontend distinga "sin permisos" de "rol no configurado".
     */
    public function grantedMapForTenant(int $tenantId): array
    {
        $grantsByRole = RolePermission::where(RolePermission::TENANT_ID, $tenantId)
            ->with('permission')
            ->get()
            ->groupBy(RolePermission::ROLE_ID);

        $configuredRoles = RolePermissionConfig::where(RolePermissionConfig::TENANT_ID, $tenantId)
            ->pluck(RolePermissionConfig::ROLE_ID)
            ->all();

        $defaults = $this->defaultsForTenant($tenantId);

        $map = [];
        foreach (self::CONFIGURABLE_ROLES as $role) {
            $grants = $grantsByRole->get($role->value, new Collection);

            if ($grants->isNotEmpty()) {
                $map[$role->value] = $grants->pluck('permission.key')->values()->all();

                continue;
            }

            // Sin grants: puede ser "nunca configurado" (mostrar los defaults, para que el
            // panel de Roles y permisos no aparezca todo destildado en un tenant/rol nuevo) o
            // "Admin lo dejó en cero a propósito" (mostrar vacío) — misma distinción que ya
            // usa grantedKeys(), aplicada aquí por tenant en vez de por el tenant_id global.
            $configured = in_array($role->value, $configuredRoles, true);
            $map[$role->value] = $configured ? [] : ($defaults[$role->value] ?? []);
        }

        return $map;
    }

    /**
     * Usado dentro de requests autenticadas, donde el tenant ya está resuelto por ResolveTenant.
     * Si el rol nunca fue configurado (ni por el Admin en "Roles y permisos" ni por el seeding de
     * SuperAdmin — sin fila en role_permission_configs), cae a DEFAULTS: un rol sin configurar
     * debe comportarse como los permisos por defecto, no como "sin acceso a nada". Si el rol SÍ
     * fue configurado, se respeta el resultado real aunque sea vacío (Admin quitó todos los
     * permisos a propósito) — de ahí que no baste con mirar si role_permissions tiene filas, ya
     * que "nunca configurado" y "configurado con cero permisos" se ven igual en esa tabla.
     */
    public function grantedKeys(int $roleId): array
    {
        $grants = RolePermission::where(RolePermission::ROLE_ID, $roleId)
            ->with('permission')
            ->get();

        if ($grants->isNotEmpty()) {
            return $grants->pluck('permission.key')->values()->all();
        }

        $configured = RolePermissionConfig::where(RolePermissionConfig::ROLE_ID, $roleId)->exists();

        return $configured ? [] : ($this->defaultsForTenant(app('tenant_id'))[$roleId] ?? []);
    }

    /** Siembra los permisos default para un tenant nuevo — idempotente por rol (no pisa configuraciones existentes). */
    public function seedDefaultsForTenant(int $tenantId): void
    {
        foreach ($this->defaultsForTenant($tenantId) as $roleId => $keys) {
            $alreadyConfigured = RolePermissionConfig::where(RolePermissionConfig::TENANT_ID, $tenantId)
                ->where(RolePermissionConfig::ROLE_ID, $roleId)
                ->exists();

            if ($alreadyConfigured) {
                continue;
            }

            $permissionIds = Permission::whereIn(Permission::KEY, $keys)->pluck('id');
            $rows = $permissionIds->map(fn ($permissionId) => [
                RolePermission::TENANT_ID => $tenantId,
                RolePermission::ROLE_ID => $roleId,
                RolePermission::PERMISSION_ID => $permissionId,
            ])->all();

            if ($rows !== []) {
                RolePermission::insert($rows);
            }

            RolePermissionConfig::create([
                RolePermissionConfig::TENANT_ID => $tenantId,
                RolePermissionConfig::ROLE_ID => $roleId,
            ]);
        }
    }

    /**
     * Valida que un rol sea configurable para el tenant dado (usado tanto desde el panel Admin del
     * propio tenant, donde $tenantId viene de app('tenant_id'), como desde el panel SuperAdmin,
     * donde $tenantId es el tenant objetivo explícito). Retorna el mensaje de error o null si es
     * válido.
     */
    public function validateRoleConfigurable(int $tenantId, int $roleId): ?string
    {
        $configurableValues = array_map(fn (RoleEnum $role) => $role->value, self::CONFIGURABLE_ROLES);

        if (! in_array($roleId, $configurableValues, true)) {
            return 'Este rol no es configurable.';
        }

        // Cocina y Caja no existen como roles asignables en negocios de venta por peso ni en
        // retail — ver useUsersPage.ts en el frontend, que excluye estos roles con el mismo
        // criterio (getExcludedRoles()).
        $rolesSinCocinaCaja = [RoleEnum::COCINA->value, RoleEnum::CAJA->value];

        if (BusinessConfigModel::excludesCocinaCajaRoles($tenantId) && in_array($roleId, $rolesSinCocinaCaja, true)) {
            return 'Este rol no está disponible para este tipo de negocio.';
        }

        return null;
    }

    public function sync(int $roleId, array $keys, ?int $tenantId = null): void
    {
        $tenantId ??= app('tenant_id');
        $permissionIds = Permission::whereIn(Permission::KEY, $keys)->pluck('id');

        // Filtro explícito por tenant_id: RolePermission::HasTenant solo aplica su scope global
        // cuando app('tenant_id') está bindeado (rutas del tenant vía ResolveTenant). Las rutas
        // SuperAdmin no lo bindean, así que sin este filtro explícito este delete borraría el rol
        // en TODOS los tenants en vez de solo en el tenant objetivo.
        RolePermission::where(RolePermission::TENANT_ID, $tenantId)
            ->where(RolePermission::ROLE_ID, $roleId)
            ->delete();

        $rows = $permissionIds->map(fn ($permissionId) => [
            RolePermission::TENANT_ID => $tenantId,
            RolePermission::ROLE_ID => $roleId,
            RolePermission::PERMISSION_ID => $permissionId,
        ])->all();

        if ($rows !== []) {
            RolePermission::insert($rows);
        }

        RolePermissionConfig::firstOrCreate([
            RolePermissionConfig::TENANT_ID => $tenantId,
            RolePermissionConfig::ROLE_ID => $roleId,
        ]);
    }
}
