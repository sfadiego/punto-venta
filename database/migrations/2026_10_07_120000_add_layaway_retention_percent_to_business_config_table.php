<?php

use App\Models\BusinessConfigModel;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            // % de lo abonado que se sugiere retener al cancelar un apartado (0 = reembolso total). Es
            // solo una sugerencia que quien cancela puede ajustar en cada cancelación.
            $table->decimal(BusinessConfigModel::LAYAWAY_RETENTION_PERCENT, 5, 2)->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->dropColumn(BusinessConfigModel::LAYAWAY_RETENTION_PERCENT);
        });
    }
};
