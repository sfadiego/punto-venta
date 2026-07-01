<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_product', function (Blueprint $table) {
            $table->string('nombre_extra')->nullable()->after('precio');
        });

        // SQLite no soporta change() en tablas con FK a "order" (palabra reservada).
        // En fresh installs la columna ya es nullable desde la migración original.
        // Este change() aplica solo a MySQL para instancias existentes con NOT NULL.
        if (DB::connection()->getDriverName() !== 'sqlite') {
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

        if (DB::connection()->getDriverName() !== 'sqlite') {
            Schema::table('order_product', function (Blueprint $table) {
                $table->unsignedBigInteger('producto_id')->nullable(false)->change();
            });
        }
    }
};
