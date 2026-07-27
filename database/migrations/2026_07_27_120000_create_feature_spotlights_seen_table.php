<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feature_spotlights_seen', function (Blueprint $table) {
            $table->id();
            // Nulo en filas "globales de tenant" (ver tenant_id) — un feature marcado como
            // ya visto para todo un tenant no pertenece a un usuario en particular.
            $table->foreignId('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            // Presente en ambos tipos de fila: por-usuario (junto a user_id) y global de
            // tenant (con user_id nulo) — así el SuperAdmin puede marcar un feature como
            // "ya no relevante" para todos los usuarios de un cliente sin crear una fila
            // por cada uno.
            $table->foreignId('tenant_id')->nullable()->constrained('business_config')->cascadeOnDelete();
            $table->string('feature_key');
            $table->timestamp('seen_at');
            $table->timestamps();

            $table->unique(['user_id', 'feature_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_spotlights_seen');
    }
};
