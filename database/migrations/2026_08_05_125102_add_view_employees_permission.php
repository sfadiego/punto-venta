<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('permissions')->insertOrIgnore([
            'key' => 'viewEmployees',
            'label' => 'Ver empleados',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('permissions')->where('key', 'viewEmployees')->delete();
    }
};
