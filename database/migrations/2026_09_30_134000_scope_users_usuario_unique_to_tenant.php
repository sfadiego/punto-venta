<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `usuario` no se usa para login (eso es `email`, ver AuthService::login) — es solo una
 * referencia visual, así que tenía que ser único por tenant, no global. El índice único
 * global de la migración original bloqueaba que dos tenants distintos usaran "admin" como
 * usuario de su administrador, aunque nunca compiten entre sí para autenticarse. Puramente
 * aditiva/estructural — no toca datos existentes, solo cambia el índice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['usuario']);
            $table->unique([User::TENANT_ID, User::USUARIO]);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique([User::TENANT_ID, User::USUARIO]);
            $table->unique('usuario');
        });
    }
};
