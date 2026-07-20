<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->string('name');
            $table->string('phone', 20)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('allow_credit')->default(true);
            $table->decimal('balance', 10, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('tenant_id');
            $table->index(['tenant_id', 'balance']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
