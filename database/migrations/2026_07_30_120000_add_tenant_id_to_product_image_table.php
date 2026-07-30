<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_image', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('id')->constrained('business_config')->nullOnDelete();
        });

        DB::table('product_image')->update([
            'tenant_id' => DB::raw('(select tenant_id from product where product.foto_id = product_image.id)'),
        ]);
    }

    public function down(): void
    {
        Schema::table('product_image', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
        });
    }
};
