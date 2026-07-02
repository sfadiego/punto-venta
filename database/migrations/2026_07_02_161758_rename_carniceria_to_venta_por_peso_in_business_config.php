<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('business_config')
            ->where('tipo_negocio', 'carniceria')
            ->update(['tipo_negocio' => 'venta_por_peso']);

        DB::table('business_config')
            ->where('tipo_negocio', 'polleria')
            ->update(['tipo_negocio' => 'venta_por_peso']);
    }

    public function down(): void
    {
        DB::table('business_config')
            ->where('tipo_negocio', 'venta_por_peso')
            ->update(['tipo_negocio' => 'carniceria']);
    }
};
