<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Elimina la columna branch_id de product y product_variants, en desuso desde que la
 * disponibilidad por sucursal se resolvió vía la tabla pivote product_branch (relación
 * muchos-a-muchos, ver CLAUDE.md). Confirmado antes de escribir esta migración:
 * - product.branch_id: los 2 valores existentes ya se migraron a product_branch en
 *   2026_09_17_100000_create_product_branch_table.php (backfill verificado 1:1).
 * - product_variants.branch_id: nunca tuvo ningún valor asignado (0 filas no-null) —
 *   no se le encontró ningún lector en el código, solo un escritor
 *   (BranchActivationService, ya removido).
 * Ninguna de las dos se leía ya en ningún flujo de la aplicación al momento de este drop.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropConstrainedForeignId('branch_id');
        });
    }

    public function down(): void
    {
        Schema::table('product', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()
                ->after('tenant_id')
                ->constrained('branches')
                ->nullOnDelete();
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()
                ->after('tenant_id')
                ->constrained('branches')
                ->nullOnDelete();
        });
    }
};
