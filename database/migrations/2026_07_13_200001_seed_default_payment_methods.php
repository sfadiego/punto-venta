<?php

use App\Models\BusinessConfigModel;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $tenants = BusinessConfigModel::all();

        foreach ($tenants as $tenant) {
            DB::table('payment_methods')->insert([
                ['tenant_id' => $tenant->id, 'name' => 'Efectivo',      'active' => true, 'created_at' => now(), 'updated_at' => now()],
                ['tenant_id' => $tenant->id, 'name' => 'Transferencia', 'active' => true, 'created_at' => now(), 'updated_at' => now()],
            ]);
        }
    }

    public function down(): void
    {
        DB::table('payment_methods')->whereIn('name', ['Efectivo', 'Transferencia'])->delete();
    }
};
