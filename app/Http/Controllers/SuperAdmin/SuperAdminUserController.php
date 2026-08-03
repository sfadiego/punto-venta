<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Enums\RoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdminUserStoreRequest;
use App\Http\Requests\SuperAdminUserUpdateRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Response;

class SuperAdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        $superAdmins = User::withoutGlobalScopes()
            ->where(User::ROL_ID, RoleEnum::SUPERADMIN->value)
            ->orderBy(User::NOMBRE)
            ->get();

        return Response::success($superAdmins);
    }

    public function store(SuperAdminUserStoreRequest $param): JsonResponse
    {
        $user = User::create([
            User::NOMBRE => $param->nombre,
            User::APELLIDO_PATERNO => $param->apellido_paterno,
            User::APELLIDO_MATERNO => $param->apellido_materno ?? '',
            User::EMAIL => $param->email,
            User::USUARIO => $param->usuario,
            User::PASSWORD => Hash::make($param->password),
            User::ROL_ID => RoleEnum::SUPERADMIN->value,
            User::ACTIVO => true,
            User::TENANT_ID => null,
        ]);

        return Response::success($user);
    }

    public function update(int $user, SuperAdminUserUpdateRequest $param): JsonResponse
    {
        $user = User::withoutGlobalScopes()
            ->where(User::ROL_ID, RoleEnum::SUPERADMIN->value)
            ->findOrFail($user);

        $data = [
            User::NOMBRE => $param->nombre,
            User::APELLIDO_PATERNO => $param->apellido_paterno,
            User::APELLIDO_MATERNO => $param->apellido_materno ?? '',
            User::EMAIL => $param->email,
            User::USUARIO => $param->usuario,
        ];

        if ($param->filled('password')) {
            $data[User::PASSWORD] = Hash::make($param->password);
        }

        $user->update($data);

        return Response::success($user->fresh());
    }
}
