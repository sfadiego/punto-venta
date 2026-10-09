<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Una devolución es un registro de la orden con sus líneas — antes solo existían los
        // movimientos de stock sueltos, sin dónde guardar el motivo ni agrupar varias líneas.
        Schema::create('order_returns', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->foreignId('order_id')->constrained('order')->cascadeOnDelete();
            $table->string('reason'); // ReturnReasonEnum
            $table->string('note')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index(['tenant_id', 'order_id']);
        });

        Schema::create('order_return_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->foreignId('order_return_id')->constrained('order_returns')->cascadeOnDelete();
            $table->unsignedBigInteger('order_product_id');
            $table->decimal('quantity', 10, 2);
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('order_return_id');
            $table->index('order_product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_return_items');
        Schema::dropIfExists('order_returns');
    }
};
