<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_absences', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('date');
            $table->boolean('notified')->default(false);
            $table->decimal('deduction_amount', 10, 2)->nullable();
            $table->string('notes', 500)->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->unique(['employee_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_absences');
    }
};
