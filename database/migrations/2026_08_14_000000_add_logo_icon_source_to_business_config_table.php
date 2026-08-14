<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->string('logo_icon_source', 20)->nullable()->after('logo_icon');
        });

        DB::table('business_config')
            ->whereNotNull('logo_icon')
            ->update(['logo_icon_source' => 'lucide']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('business_config', function (Blueprint $table) {
            $table->dropColumn('logo_icon_source');
        });
    }
};
