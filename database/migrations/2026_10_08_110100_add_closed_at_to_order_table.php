<?php

use App\Enums\OrderStatusEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order', function (Blueprint $table) {
            // Cuándo se concretó la venta (cerrada, o liquidada si fue un apartado) — base del plazo de
            // devolución. created_at no sirve: un apartado liquidado meses después seguiría contando
            // desde que se apartó.
            $table->timestamp('closed_at')->nullable()->after('layaway_due_date');
        });

        // Las ventas ya cerradas toman su última modificación como mejor aproximación.
        DB::table('order')
            ->where('estatus_pedido_id', OrderStatusEnum::CLOSED->value)
            ->update(['closed_at' => DB::raw('updated_at')]);
    }

    public function down(): void
    {
        Schema::table('order', function (Blueprint $table) {
            $table->dropColumn('closed_at');
        });
    }
};
