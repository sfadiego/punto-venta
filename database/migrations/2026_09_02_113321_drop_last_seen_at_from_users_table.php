<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // users_tenant_last_seen_index es hoy el único índice que respalda el foreign key de
        // tenant_id — hay que reemplazarlo por uno propio sobre tenant_id antes de poder
        // dropearlo, o MySQL rechaza el drop (error 1553).
        Schema::table('users', function (Blueprint $table) {
            $table->index('tenant_id', 'users_tenant_id_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_tenant_last_seen_index');
            $table->dropIndex(['last_seen_at']);
            $table->dropColumn('last_seen_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_seen_at')->nullable()->after('remember_token');
            $table->index('last_seen_at');
            $table->index(['tenant_id', 'last_seen_at'], 'users_tenant_last_seen_index');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_tenant_id_index');
        });
    }
};
