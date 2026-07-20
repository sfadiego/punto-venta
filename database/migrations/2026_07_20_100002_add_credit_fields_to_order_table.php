<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order', function (Blueprint $table) {
            $table->foreignId('customer_id')->nullable()->after('payment_method_id')
                ->constrained('customers')->nullOnDelete();
            $table->boolean('is_credit')->default(false)->after('customer_id');
            $table->timestamp('credit_applied_at')->nullable()->after('is_credit');

            $table->index('customer_id');
            $table->index(['tenant_id', 'is_credit']);
        });
    }

    public function down(): void
    {
        Schema::table('order', function (Blueprint $table) {
            $table->dropIndex(['tenant_id', 'is_credit']);
            $table->dropIndex(['customer_id']);
            $table->dropConstrainedForeignId('customer_id');
            $table->dropColumn(['is_credit', 'credit_applied_at']);
        });
    }
};
