<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->foreignId('sistema_id')->constrained('main_order_report')->cascadeOnDelete();
            $table->unsignedBigInteger('user_id');
            $table->string('concepto');
            $table->decimal('monto', 10, 2);
            $table->string('observaciones', 500)->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index(['tenant_id', 'sistema_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
