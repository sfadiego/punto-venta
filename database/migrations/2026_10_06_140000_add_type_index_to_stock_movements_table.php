<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            // Reporte de productos sin movimiento (SlowMovingProductsReport::restockAggregate): busca
            // el último ingreso de stock por producto (type = entry / adjustment). Sin este índice
            // recorre TODO el historial del tenant, dominado por las salidas por venta; con él lee
            // solo las entradas y ajustes (medido: 522 ms → 6 ms con ~770 mil movimientos).
            $table->index(['tenant_id', 'type', 'product_id', 'created_at'], 'stock_movements_tenant_type_product_created_idx');
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex('stock_movements_tenant_type_product_created_idx');
        });
    }
};
