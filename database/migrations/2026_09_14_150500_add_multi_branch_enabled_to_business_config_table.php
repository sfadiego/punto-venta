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
            $table->boolean(BusinessConfigModel::MULTI_BRANCH_ENABLED)->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->dropColumn(BusinessConfigModel::MULTI_BRANCH_ENABLED);
        });
    }
};
