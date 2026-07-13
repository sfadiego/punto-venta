<?php

use App\Enums\OrderStatusEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('order_status')->insertOrIgnore([
            'id' => OrderStatusEnum::PENDING_CONFIRMATION->value,
            'nombre' => 'pending confirmation',
        ]);
    }

    public function down(): void
    {
        DB::table('order_status')->where('id', OrderStatusEnum::PENDING_CONFIRMATION->value)->delete();
    }
};
