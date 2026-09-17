<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_branch', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('tenant_id');
            $table->foreignId('product_id')->constrained('product')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->timestamps();

            $table->index('tenant_id');
            $table->unique(['product_id', 'branch_id']);
        });

        // Backfill: producto con branch_id (columna vieja, ahora en desuso) → una fila en
        // el pivote. Producto sin branch_id sigue significando "disponible en todas las
        // sucursales" (cero filas), misma semántica de antes.
        DB::table('product')
            ->whereNotNull('branch_id')
            ->select('id', 'tenant_id', 'branch_id')
            ->orderBy('id')
            ->chunk(500, function ($products) {
                $rows = $products->map(fn ($product) => [
                    'tenant_id' => $product->tenant_id,
                    'product_id' => $product->id,
                    'branch_id' => $product->branch_id,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])->all();

                DB::table('product_branch')->insert($rows);
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_branch');
    }
};
