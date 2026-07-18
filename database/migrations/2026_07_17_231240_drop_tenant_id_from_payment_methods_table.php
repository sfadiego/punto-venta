<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('payment_methods', 'tenant_id')) {
            return;
        }

        // Deduplicar: conservar el registro de menor id por nombre
        $keep = DB::table('payment_methods')
            ->select('name', DB::raw('MIN(id) as keep_id'))
            ->groupBy('name')
            ->pluck('keep_id');

        foreach (DB::table('payment_methods')->whereIn('id', $keep)->get() as $method) {
            $duplicateIds = DB::table('payment_methods')
                ->where('name', $method->name)
                ->where('id', '!=', $method->id)
                ->pluck('id');

            if ($duplicateIds->isNotEmpty()) {
                DB::table('order')
                    ->whereIn('payment_method_id', $duplicateIds)
                    ->update(['payment_method_id' => $method->id]);

                DB::table('payment_methods')->whereIn('id', $duplicateIds)->delete();
            }
        }

        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn('tenant_id');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('payment_methods', 'tenant_id')) {
            return;
        }

        Schema::table('payment_methods', function (Blueprint $table) {
            $table->unsignedBigInteger('tenant_id')->nullable()->after('id');
        });
    }
};
