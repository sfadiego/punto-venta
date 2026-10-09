<?php

use App\Models\MainOrderReportModel;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('main_order_report', function (Blueprint $table) {
            // Auditoría del cierre: quién y cuándo cerró la sesión, y el motivo cuando se cierra una
            // caja sin ventas (aperturas y cierres sin control: cada sesión vacía queda justificada).
            $table->foreignId(MainOrderReportModel::CLOSED_BY)->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp(MainOrderReportModel::CLOSED_AT)->nullable();
            $table->string(MainOrderReportModel::EMPTY_CLOSE_REASON)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('main_order_report', function (Blueprint $table) {
            $table->dropConstrainedForeignId(MainOrderReportModel::CLOSED_BY);
            $table->dropColumn([MainOrderReportModel::CLOSED_AT, MainOrderReportModel::EMPTY_CLOSE_REASON]);
        });
    }
};
