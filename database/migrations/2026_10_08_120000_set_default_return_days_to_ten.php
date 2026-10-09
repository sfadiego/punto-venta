<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private const DEFAULT_DAYS = 10;

    public function up(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            // Política de devoluciones: solo en los primeros días tras la venta. El Admin del negocio puede
            // cambiarlo (0 = sin límite).
            $table->unsignedSmallInteger('return_days')->default(self::DEFAULT_DAYS)->change();
        });

        // La columna nació con 0 (sin límite) y aún no se había configurado: queda con la política por defecto.
        DB::table('business_config')->where('return_days', 0)->update(['return_days' => self::DEFAULT_DAYS]);
    }

    public function down(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->unsignedSmallInteger('return_days')->default(0)->change();
        });
    }
};
