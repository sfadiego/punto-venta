<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('app_settings')->insertOrIgnore([
            'key'        => 'payment_info',
            'value'      => json_encode([
                'bank'        => 'Mercado Pago',
                'account'     => '',
                'holder'      => 'Diego Armando Silva Facio',
                'concept'     => 'Mensualidad Sistema POS',
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('app_settings')->where('key', 'payment_info')->delete();
    }
};
