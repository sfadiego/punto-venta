<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_layaway_payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->foreignId('order_id')->constrained('order')->cascadeOnDelete();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('type'); // deposit | refund (LayawayPaymentTypeEnum)
            $table->decimal('amount', 10, 2);
            $table->unsignedBigInteger('payment_method_id')->nullable();
            // Caja (main_order_report) en la que se recibió/devolvió el dinero — el cuadre de
            // caja de cada día se calcula con esto, no con order.total.
            $table->unsignedBigInteger('sistema_id')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'customer_id']);
            $table->index('sistema_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_layaway_payments');
    }
};
