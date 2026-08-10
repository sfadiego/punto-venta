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
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->foreignId('product_id')->constrained('product')->cascadeOnDelete();
            $table->string('type'); // entry | exit | adjustment
            $table->decimal('quantity', 10, 2);
            $table->decimal('stock_before', 10, 2);
            $table->decimal('stock_after', 10, 2);
            $table->string('reason'); // sale, manual_adjustment, loss, return
            $table->nullableMorphs('reference'); // reference_type/reference_id -> order_product on reason=sale
            $table->unsignedBigInteger('created_by')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index(['tenant_id', 'product_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};
