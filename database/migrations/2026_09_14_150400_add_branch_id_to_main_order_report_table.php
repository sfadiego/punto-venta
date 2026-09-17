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
            $table->foreignId(MainOrderReportModel::BRANCH_ID)->nullable()
                ->after(MainOrderReportModel::TENANT_ID)
                ->constrained('branches')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('main_order_report', function (Blueprint $table) {
            $table->dropConstrainedForeignId(MainOrderReportModel::BRANCH_ID);
        });
    }
};
