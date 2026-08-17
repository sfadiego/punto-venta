<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            // Sin backfill: queda apagado por defecto incluso para tenants existentes de venta
            // por peso — esos siguen teniendo clientes vía sell_by_weight (ver
            // BusinessTypeEnum::features()), independiente de esta bandera. Esta bandera solo
            // habilita el módulo de clientes para tenants tipo restaurante, caso por caso.
            $table->boolean('customers_enabled')->default(false)->after('stock_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->dropColumn('customers_enabled');
        });
    }
};
