<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_returns', function (Blueprint $table) {
            // Valor total reembolsado al cliente por las líneas devueltas (cero = devolución solo de stock).
            $table->decimal('refund_amount', 10, 2)->default(0)->after('note');
            // Parte del reembolso que no salió de la caja sino que bajó el saldo del cliente (venta a crédito).
            $table->decimal('balance_applied', 10, 2)->default(0)->after('refund_amount');
            // Método con el que se devolvió el dinero y caja (main_order_report) de la que salió — el
            // cuadre de caja de cada sesión se calcula con esto, no con la venta original.
            $table->unsignedBigInteger('refund_payment_method_id')->nullable()->after('balance_applied');
            $table->unsignedBigInteger('sistema_id')->nullable()->after('refund_payment_method_id');

            $table->index('sistema_id');
        });

        Schema::table('order_return_items', function (Blueprint $table) {
            $table->decimal('refund_amount', 10, 2)->default(0)->after('quantity');
        });
    }

    public function down(): void
    {
        Schema::table('order_return_items', function (Blueprint $table) {
            $table->dropColumn('refund_amount');
        });

        Schema::table('order_returns', function (Blueprint $table) {
            $table->dropIndex(['sistema_id']);
            $table->dropColumn(['refund_amount', 'balance_applied', 'refund_payment_method_id', 'sistema_id']);
        });
    }
};
