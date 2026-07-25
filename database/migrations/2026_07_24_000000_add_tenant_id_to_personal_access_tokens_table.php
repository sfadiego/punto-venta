<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_id')->nullable()->after('tokenable_id');
            $table->index(['tenant_id', 'last_used_at'], 'personal_access_tokens_tenant_last_used_index');
        });
    }

    public function down(): void
    {
        Schema::table('personal_access_tokens', function (Blueprint $table) {
            $table->dropIndex('personal_access_tokens_tenant_last_used_index');
            $table->dropColumn('tenant_id');
        });
    }
};
