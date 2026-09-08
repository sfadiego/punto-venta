<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Acota las columnas de stock de decimal(10,2) (máximo 99,999,999.99, sin sentido de negocio
 * real) a decimal(8,2) (máximo 999,999.99) — un tope coherente para inventario de cualquier
 * negocio, y una defensa a nivel de base de datos ante un reajuste manual mal tecleado (ver
 * ProductStockAdjustmentRequest, que valida el mismo máximo antes de llegar aquí).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product', function (Blueprint $table) {
            $table->decimal('stock', 8, 2)->nullable()->change();
            $table->decimal('min_stock', 8, 2)->nullable()->change();
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->decimal('stock', 8, 2)->nullable()->change();
            $table->decimal('min_stock', 8, 2)->nullable()->change();
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->decimal('quantity', 8, 2)->change();
            $table->decimal('stock_before', 8, 2)->change();
            $table->decimal('stock_after', 8, 2)->change();
        });
    }

    public function down(): void
    {
        Schema::table('product', function (Blueprint $table) {
            $table->decimal('stock', 10, 2)->nullable()->change();
            $table->decimal('min_stock', 10, 2)->nullable()->change();
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->decimal('stock', 10, 2)->nullable()->change();
            $table->decimal('min_stock', 10, 2)->nullable()->change();
        });

        Schema::table('stock_movements', function (Blueprint $table) {
            $table->decimal('quantity', 10, 2)->change();
            $table->decimal('stock_before', 10, 2)->change();
            $table->decimal('stock_after', 10, 2)->change();
        });
    }
};
