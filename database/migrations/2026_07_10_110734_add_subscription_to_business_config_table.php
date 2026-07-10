<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->string('subscription_plan', 20)->nullable()->after('printer_enabled');
            $table->date('subscription_expires_at')->nullable()->after('subscription_plan');
        });
    }

    public function down(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->dropColumn(['subscription_plan', 'subscription_expires_at']);
        });
    }
};
