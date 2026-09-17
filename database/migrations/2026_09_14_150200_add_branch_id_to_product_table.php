<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Nota: usa nombres de columna literales, no constantes de ProductModel — las migraciones
// deben poder correr desde cero (fresh install / CI) sin depender del estado actual del
// modelo. Esta columna quedó en desuso a partir de product_branch (pivote) y se elimina
// en 2026_09_18_100000_drop_branch_id_from_product_tables.php.
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()
                ->after('tenant_id')
                ->constrained('branches')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('product', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
        });
    }
};
