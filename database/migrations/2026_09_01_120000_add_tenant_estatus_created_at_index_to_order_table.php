<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Reportes históricos filtrados solo por fecha (sin sistema_id): reporte por
        // categoría, export de ventas, listado de órdenes por fecha/semana/mes. El índice
        // existente (sistema_id, estatus_pedido_id) no ayuda en esa rama porque no incluye
        // sistema_id — este cubre el filtro real que usan esas consultas.
        Schema::table('order', function (Blueprint $table) {
            $table->index(['tenant_id', 'estatus_pedido_id', 'created_at'], 'order_tenant_estatus_created_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('order', function (Blueprint $table) {
            $table->dropIndex('order_tenant_estatus_created_at_index');
        });
    }
};
