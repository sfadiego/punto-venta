<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            // Agrupa los movimientos de una misma devolución (entrada y, si fue defectuoso, merma).
            // Nulo en movimientos que no son devolución y en las devoluciones anteriores a este
            // registro — esas siguen identificándose por reason=return y su referencia a la línea.
            $table->unsignedBigInteger('order_return_id')->nullable()->after('reference_id');
            $table->index('order_return_id');
        });
    }

    public function down(): void
    {
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex(['order_return_id']);
            $table->dropColumn('order_return_id');
        });
    }
};
