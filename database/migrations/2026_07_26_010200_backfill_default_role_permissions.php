<?php

use App\Enums\RoleEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    // Debe reflejar los defaults actuales de resources/js/hooks/usePermissions.ts
    // (DEFAULT_ROLE_PERMISSIONS) para no cambiar el comportamiento de tenants existentes.
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

    public function up(): void
    {
        $permissionIds = DB::table('permissions')->pluck('id', 'key');
        $tenantIds = DB::table('business_config')->pluck('id');
        $now = now();

        $rows = [];
        foreach ($tenantIds as $tenantId) {
            foreach (self::DEFAULTS as $roleId => $keys) {
                foreach ($keys as $key) {
                    if (! isset($permissionIds[$key])) {
                        continue;
                    }

                    $rows[] = [
                        'tenant_id' => $tenantId,
                        'role_id' => $roleId,
                        'permission_id' => $permissionIds[$key],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }
        }

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('role_permissions')->insertOrIgnore($chunk);
        }
    }

    public function down(): void
    {
        DB::table('role_permissions')->truncate();
    }
};
