<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product', function (Blueprint $table) {
            // Catálogo de venta y página de productos filtran por tenant (TenantScope) y por
            // categoría. Hasta ahora solo existían el índice de la FK categoria_id (sin tenant)
            // y el unique (tenant_id, product_code), que no sirve para filtrar por categoría.
            $table->index(['tenant_id', 'categoria_id'], 'product_tenant_categoria_index');
        });
    }

    public function down(): void
    {
        Schema::table('product', function (Blueprint $table) {
            $table->dropIndex('product_tenant_categoria_index');
        });
    }
};
