<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('permissions')->insertOrIgnore([
            'key' => 'processReturns',
            'label' => 'Gestionar devoluciones',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // La devolución dejó de exigir manageStock: los roles que ya la tenían configurada conservan
        // su acceso recibiendo el permiso nuevo.
        $manageStockId = DB::table('permissions')->where('key', 'manageStock')->value('id');
        $processReturnsId = DB::table('permissions')->where('key', 'processReturns')->value('id');

        if (! $manageStockId || ! $processReturnsId) {
            return;
        }

        $rows = DB::table('role_permissions')
            ->where('permission_id', $manageStockId)
            ->get(['tenant_id', 'role_id'])
            ->map(fn ($row) => [
                'tenant_id' => $row->tenant_id,
                'role_id' => $row->role_id,
                'permission_id' => $processReturnsId,
                'created_at' => now(),
                'updated_at' => now(),
            ])
            ->all();

        if ($rows !== []) {
            DB::table('role_permissions')->insertOrIgnore($rows);
        }
    }

    public function down(): void
    {
        $id = DB::table('permissions')->where('key', 'processReturns')->value('id');
        if ($id) {
            DB::table('role_permissions')->where('permission_id', $id)->delete();
            DB::table('permissions')->where('id', $id)->delete();
        }
    }
};
