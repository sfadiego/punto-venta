<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('demo_requests', 'client_leads');
    }

    public function down(): void
    {
        Schema::rename('client_leads', 'demo_requests');
    }
};
