<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->unsignedSmallInteger('max_users')->nullable()->after('subscription_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->dropColumn('max_users');
        });
    }
};
