<?php

namespace App\Http\Controllers;

use App\Enums\RoleEnum;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Response;

class AuthController extends Controller
{
    public function register(RegisterRequest $params): JsonResponse
    {
        $user = User::register(
            nombre: $params->nombre,
            email: $params->email,
            usuario: $params->usuario,
            password: bcrypt($params->password),
            apellidoPaterno: $params->apellido_paterno,
            apellidoMaterno: $params->apellido_materno ?? '',
            rolId: RoleEnum::EMPLOYE->value,
        );

        return Response::success(
            [
                'user' => $user->toArray(),
                'token' => $user->issueAccessToken()->plainTextToken,
            ]
        );
    }

    public function login(LoginRequest $params, AuthService $authService): JsonResponse
    {
        $result = $authService->login($params->email, $params->password, $params->slug);

        if (! $result->success) {
            $data = $result->code ? ['code' => $result->code] : null;

            return Response::error($result->message, $data, $result->status);
        }

        return Response::success($result->data);
    }

    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            $user->updateQuietly([User::LAST_SEEN_AT => null]);
            Cache::forget("user_last_seen_{$user->id}");
            $request->user()->currentAccessToken()->delete();
        }

        return Response::success([], 'Sesión cerrada correctamente.');
    }
}
