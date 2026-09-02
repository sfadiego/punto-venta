<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    /**
     * Marca qué (tenant, rol) fue configurado explícitamente en "Roles y permisos" o vía
     * seedDefaultsForTenant() — necesario para distinguir "rol nunca configurado" (debe caer a
     * los defaults en RolePermissionService::grantedKeys()) de "Admin quitó todos los permisos a
     * propósito" (debe quedar en 0 permisos reales), ya que ambos casos dejan 0 filas en
     * role_permissions y no son distinguibles sin este marcador.
     */
    public function up(): void
    {
        Schema::create('role_permission_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('business_config')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('role')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['tenant_id', 'role_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('role_permission_configs');
    }
};
