<?php

use App\Enums\OrderStatusEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $validIds = collect(OrderStatusEnum::cases())->map(fn ($c) => $c->value)->all();

        DB::table('order_status')
            ->whereNotIn('id', $validIds)
            ->delete();
    }

    public function down(): void
    {
        // No hay forma de recuperar los registros eliminados
    }
};
