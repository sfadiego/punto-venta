<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order', function (Blueprint $table) {
            $table->string('customer_phone', 20)->nullable()->after('nombre_pedido');
            $table->boolean('is_delivery')->default(false)->after('customer_phone');
            $table->string('delivery_address', 500)->nullable()->after('is_delivery');
        });
    }

    public function down(): void
    {
        Schema::table('order', function (Blueprint $table) {
            $table->dropColumn(['customer_phone', 'is_delivery', 'delivery_address']);
        });
    }
};
