<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_product_addons', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->foreignId('order_product_id')->constrained('order_product')->cascadeOnDelete();
            // nullable + nullOnDelete: si el complemento se borra del catálogo, la línea
            // vendida conserva name/price como copia histórica.
            $table->foreignId('addon_id')->nullable()->constrained('addons')->nullOnDelete();
            $table->string('name');
            $table->decimal('price', 10, 2)->default(0);
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();

            $table->index('tenant_id');
            $table->index('order_product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_product_addons');
    }
};
