<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order', function (Blueprint $table) {
            // Caché del total abonado en un apartado (suma de depósitos menos reembolsos de
            // order_layaway_payments). Cero para cualquier orden que no sea apartado.
            $table->decimal('amount_paid', 10, 2)->default(0)->after('propina');
            $table->date('layaway_due_date')->nullable()->after('amount_paid');

            $table->index(['tenant_id', 'estatus_pedido_id', 'layaway_due_date'], 'order_layaway_due_idx');
        });
    }

    public function down(): void
    {
        Schema::table('order', function (Blueprint $table) {
            $table->dropIndex('order_layaway_due_idx');
            $table->dropColumn(['amount_paid', 'layaway_due_date']);
        });
    }
};
