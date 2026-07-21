<?php

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
        Schema::table('error_reporting', function (Blueprint $table) {
            $table->text('stack_trace')->nullable()->after('error_message');
            $table->unsignedBigInteger('user_id')->nullable()->after('stack_trace');
            $table->string('tenant_slug')->nullable()->after('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('error_reporting', function (Blueprint $table) {
            $table->dropColumn(['stack_trace', 'user_id', 'tenant_slug']);
        });
    }
};
