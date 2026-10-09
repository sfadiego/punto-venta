<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            // Días desde la venta durante los que se acepta una devolución (0 = sin límite). El Admin
            // puede devolver fuera de plazo.
            $table->unsignedSmallInteger('return_days')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->dropColumn('return_days');
        });
    }
};
