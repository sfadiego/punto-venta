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
        Schema::table('product', function (Blueprint $table) {
            $table->boolean('manage_stock')->default(false)->after('unidad_medida');
            $table->decimal('stock', 10, 2)->nullable()->after('manage_stock');
            $table->decimal('min_stock', 10, 2)->nullable()->after('stock');
            $table->string('product_code')->nullable()->after('min_stock');
        });

        Schema::table('product', function (Blueprint $table) {
            $table->unique(['tenant_id', 'product_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'product_code']);
        });

        Schema::table('product', function (Blueprint $table) {
            $table->dropColumn(['manage_stock', 'stock', 'min_stock', 'product_code']);
        });
    }
};
