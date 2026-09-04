<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('client_leads')->whereIn('status', ['pending', 'contacted'])->update(['status' => 'follow_up']);
        DB::table('client_leads')->where('status', 'converted')->update(['status' => 'customer']);

        Schema::table('client_leads', function (Blueprint $table) {
            $table->string('status')->default('follow_up')->change();
        });
    }

    public function down(): void
    {
        Schema::table('client_leads', function (Blueprint $table) {
            $table->string('status')->default('pending')->change();
        });

        DB::table('client_leads')->where('status', 'customer')->update(['status' => 'converted']);
        DB::table('client_leads')->where('status', 'follow_up')->update(['status' => 'pending']);
    }
};
