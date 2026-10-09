<?php

use App\Enums\BusinessTypeEnum;
use App\Models\BusinessConfigModel;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // El módulo de clientes es obligatorio en retail (apartados): activa el que ya existía apagado.
        DB::table('business_config')
            ->where(BusinessConfigModel::TIPO_NEGOCIO, BusinessTypeEnum::Retail->value)
            ->update([BusinessConfigModel::CUSTOMERS_ENABLED => true]);
    }

    public function down(): void
    {
        // Sin reversa: no se puede saber cuáles tenants lo tenían apagado antes.
    }
};
