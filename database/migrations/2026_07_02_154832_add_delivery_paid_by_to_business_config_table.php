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
            $table->enum('delivery_paid_by', ['customer', 'business'])
                ->default('customer')
                ->after('costo_domicilio_default');
        });
    }

    public function down(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->dropColumn('delivery_paid_by');
        });
    }
};
