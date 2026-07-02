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
        // SQLite no soporta change() en tablas con FK a "order" (palabra reservada).
        // La columna original es numeric, compatible con decimales; se omite en SQLite.
        if (config('database.default') !== 'sqlite') {
            Schema::table('order_product', function (Blueprint $table) {
                $table->decimal('cantidad', 8, 3)->default(1)->change();
            });
        }
    }

    public function down(): void
    {
        if (config('database.default') !== 'sqlite') {
            Schema::table('order_product', function (Blueprint $table) {
                $table->integer('cantidad')->default(1)->change();
            });
        }
    }
};
