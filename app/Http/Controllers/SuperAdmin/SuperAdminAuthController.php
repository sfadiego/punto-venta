<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Enums\RoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class SuperAdminAuthController extends Controller
{
    public function login(LoginRequest $params): JsonResponse
    {
        $result = User::login(
            email: $params->email,
            password: $params->password,
        );

        if (! $result) {
            return Response::error(__('Credenciales no válidas.'));
        }

        if ($result['user']->rol_id !== RoleEnum::SUPERADMIN->value) {
            $result['user']->tokens()->delete();

            return Response::error(__('No tienes permisos de super administrador.'), 403);
        }

        return Response::success($result);
    }
}
