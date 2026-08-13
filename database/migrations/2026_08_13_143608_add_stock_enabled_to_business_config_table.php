<?php

use App\Enums\BusinessTypeEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->boolean('stock_enabled')->default(false)->after('employees_enabled');
        });

        // Los tenants de venta por peso ya usan manage_stock en producción — el default false
        // es solo para no regresar su comportamiento actual. Los de restaurante nacen
        // deshabilitados: es una capacidad nueva que el SuperAdmin debe activar caso por caso.
        DB::table('business_config')
            ->where('tipo_negocio', BusinessTypeEnum::VentaPorPeso->value)
            ->update(['stock_enabled' => true]);
    }

    public function down(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->dropColumn('stock_enabled');
        });
    }
};
