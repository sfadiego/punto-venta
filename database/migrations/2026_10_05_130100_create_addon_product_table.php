<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addon_product', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->foreignId('addon_id')->constrained('addons')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('product')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['addon_id', 'product_id']);
            $table->index(['tenant_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addon_product');
    }
};
