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
            $table->boolean('bluetooth_printing_enabled')->default(false)->after('printer_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->dropColumn('bluetooth_printing_enabled');
        });
    }
};
