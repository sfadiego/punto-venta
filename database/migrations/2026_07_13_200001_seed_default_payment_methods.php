<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Insertar solo si la tabla está vacía para evitar duplicados en re-runs
        if (DB::table('payment_methods')->count() === 0) {
            DB::table('payment_methods')->insert([
                ['name' => 'Efectivo',      'active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['name' => 'Transferencia', 'active' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }
    }

    public function down(): void
    {
        DB::table('payment_methods')->whereIn('name', ['Efectivo', 'Transferencia'])->delete();
    }
};
