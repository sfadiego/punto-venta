<?php

use App\Models\OrderProductModel;
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
        Schema::create('order_product', function (Blueprint $table) {
            $table->id();
            $table->foreignId(OrderProductModel::PRODUCTO_ID)
                ->constrained('product');
            $table->foreignId(OrderProductModel::PEDIDO_ID)
                ->constrained('order');

            $table->integer(OrderProductModel::DESCUENTO)
                ->nullable()
                ->default(0);
            $table->integer(OrderProductModel::CANTIDAD);
            $table->float(OrderProductModel::PRECIO);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_product');
    }
};
