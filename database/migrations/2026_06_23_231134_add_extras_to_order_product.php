<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_product', function (Blueprint $table) {
            $table->string('nombre_extra')->nullable()->after('precio');
        });

        // SQLite no puede hacer change() en tablas con FK a "order" (palabra reservada).
        // La columna ya existe como NOT NULL en la migración original; en SQLite
        // los valores NULL se permiten igualmente por lo que el cambio es opcional.
        if (config('database.driver', config('database.default')) !== 'sqlite') {
            Schema::table('order_product', function (Blueprint $table) {
                $table->unsignedBigInteger('producto_id')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        Schema::table('order_product', function (Blueprint $table) {
            $table->dropColumn('nombre_extra');
        });

        if (config('database.driver', config('database.default')) !== 'sqlite') {
            Schema::table('order_product', function (Blueprint $table) {
                $table->unsignedBigInteger('producto_id')->nullable(false)->change();
            });
        }
    }
};
