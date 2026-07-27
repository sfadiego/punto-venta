<?php

namespace App\Services;

use App\Enums\RoleEnum;
use App\Models\Permission;
use App\Models\RolePermission;
use Illuminate\Support\Collection;

class RolePermissionService
{
    // Roles configurables por el Admin — Admin/SuperAdmin siempre tienen bypass total en frontend.
    private const CONFIGURABLE_ROLES = [RoleEnum::EMPLOYE, RoleEnum::COCINA, RoleEnum::CAJA];

    // Debe reflejar los defaults de resources/js/hooks/usePermissions.ts (DEFAULT_ROLE_PERMISSIONS).
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

        $map = [];
        foreach (self::CONFIGURABLE_ROLES as $role) {
            $grants = $grantsByRole->get($role->value, new Collection);
            $map[$role->value] = $grants->pluck('permission.key')->values()->all();
        }

        return $map;
    }

    /** Usado dentro de requests autenticadas, donde el tenant ya está resuelto por ResolveTenant. */
    public function grantedKeys(int $roleId): array
    {
        return RolePermission::where(RolePermission::ROLE_ID, $roleId)
            ->with('permission')
            ->get()
            ->pluck('permission.key')
            ->values()
            ->all();
    }

    /** Siembra los permisos default para un tenant nuevo — idempotente por rol (no pisa configuraciones existentes). */
    public function seedDefaultsForTenant(int $tenantId): void
    {
        foreach (self::DEFAULTS as $roleId => $keys) {
            $alreadyConfigured = RolePermission::where(RolePermission::TENANT_ID, $tenantId)
                ->where(RolePermission::ROLE_ID, $roleId)
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
        }
    }

    public function sync(int $roleId, array $keys): void
    {
        $tenantId = app('tenant_id');
        $permissionIds = Permission::whereIn(Permission::KEY, $keys)->pluck('id');

        RolePermission::where(RolePermission::ROLE_ID, $roleId)->delete();

        $rows = $permissionIds->map(fn ($permissionId) => [
            RolePermission::TENANT_ID => $tenantId,
            RolePermission::ROLE_ID => $roleId,
            RolePermission::PERMISSION_ID => $permissionId,
        ])->all();

        if ($rows !== []) {
            RolePermission::insert($rows);
        }
    }
}
