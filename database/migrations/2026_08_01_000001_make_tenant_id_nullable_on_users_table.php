<?php

use App\Enums\RoleEnum;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Los SuperAdmin traían tenant_id=1 heredado del primer negocio (ver
     * UserSeeder/SuperAdminUserController), lo que hacía que sus tokens de acceso
     * (App\Models\User::issueAccessToken()) quedaran etiquetados tenant_id=1 y se
     * contaran como sesión activa / usuario del tenant 1 (widget de SuperAdmin y
     * el gate de cupo de usuarios en UserController::store()). tenant_id=null los
     * saca de ambos conteos sin tocar la lógica que ya los calcula.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger(User::TENANT_ID)->nullable()->default(null)->change();
        });

        DB::table('users')
            ->where(User::ROL_ID, RoleEnum::SUPERADMIN->value)
            ->update([User::TENANT_ID => null]);
    }

    public function down(): void
    {
        DB::table('users')
            ->where(User::ROL_ID, RoleEnum::SUPERADMIN->value)
            ->whereNull(User::TENANT_ID)
            ->update([User::TENANT_ID => 1]);

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger(User::TENANT_ID)->default(1)->nullable(false)->change();
        });
    }
};
