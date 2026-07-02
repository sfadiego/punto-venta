<?php

use App\Enums\UnidadMedidaEnum;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('product', function (Blueprint $table) {
            $table->enum('unidad_medida', array_column(UnidadMedidaEnum::cases(), 'value'))->default(UnidadMedidaEnum::Unidad->value)->after('precio');
        });
    }

    public function down(): void
    {
        Schema::table('product', function (Blueprint $table) {
            $table->dropColumn('unidad_medida');
        });
    }
};
