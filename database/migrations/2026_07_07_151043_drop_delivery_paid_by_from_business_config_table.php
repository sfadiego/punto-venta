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
            $table->dropColumn('delivery_paid_by');
        });
    }

    public function down(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->string('delivery_paid_by')->default('customer')->after('costo_domicilio_default');
        });
    }
};
