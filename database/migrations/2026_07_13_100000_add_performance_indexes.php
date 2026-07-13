<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Consulta de usuarios activos por tenant (widget SuperAdmin + login gate)
        Schema::table('users', function (Blueprint $table) {
            $table->index(['tenant_id', 'last_seen_at'], 'users_tenant_last_seen_index');
        });

        // Listado de órdenes filtradas por sistema y estado
        Schema::table('order', function (Blueprint $table) {
            $table->index(['sistema_id', 'estatus_pedido_id'], 'order_sistema_estatus_index');
        });

        // Limpieza de tokens expirados por Sanctum
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->index('expires_at', 'pat_expires_at_index');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_tenant_last_seen_index');
        });

        Schema::table('order', function (Blueprint $table) {
            $table->dropIndex('order_sistema_estatus_index');
        });

        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropIndex('pat_expires_at_index');
        });
    }
};
