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
        Schema::table('provider_purchases', function (Blueprint $table) {
            $table->boolean('is_credit')->default(false)->after('amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('provider_purchases', function (Blueprint $table) {
            $table->dropColumn('is_credit');
        });
    }
};
