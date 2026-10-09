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
            $table->decimal(BusinessConfigModel::LAYAWAY_MIN_PERCENT, 5, 2)->default(10);
            $table->unsignedSmallInteger(BusinessConfigModel::LAYAWAY_DAYS)->default(30);
        });
    }

    public function down(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->dropColumn([BusinessConfigModel::LAYAWAY_MIN_PERCENT, BusinessConfigModel::LAYAWAY_DAYS]);
        });
    }
};
