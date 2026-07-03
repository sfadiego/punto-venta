<?php

use App\Enums\OrderStatusEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('order_status')
            ->where('id', OrderStatusEnum::SERVED->value)
            ->update(['nombre' => OrderStatusEnum::orderStatusName(OrderStatusEnum::SERVED)]);
    }

    public function down(): void
    {
        DB::table('order_status')
            ->where('id', OrderStatusEnum::SERVED->value)
            ->update(['nombre' => 'ready to serve']);
    }
};
