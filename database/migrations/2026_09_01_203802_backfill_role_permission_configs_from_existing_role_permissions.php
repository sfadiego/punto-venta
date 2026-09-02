<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Sin este backfill, seedDefaultsForTenant() dejaría de ser idempotente para tenants que ya
 * tienen role_permissions reales: al cambiar su chequeo de "¿existen filas?" a "¿existe el
 * marcador?", intentaría reinsertar los mismos permission_id y rompería con un duplicate-key
 * (unique tenant_id+role_id+permission_id en role_permissions). Marca como configurado cada
 * combinación (tenant_id, role_id) que ya tiene al menos una fila real hoy — no toca
 * role_permissions ni cambia ningún permiso otorgado, solo agrega el marcador que ya deberían
 * tener.
 */
return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $pairs = DB::table('role_permissions')
            ->select('tenant_id', 'role_id')
            ->distinct()
            ->get();

        $rows = $pairs->map(fn ($pair) => [
            'tenant_id' => $pair->tenant_id,
            'role_id' => $pair->role_id,
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('role_permission_configs')->insertOrIgnore($chunk);
        }
    }

    public function down(): void
    {
        DB::table('role_permission_configs')->truncate();
    }
};
