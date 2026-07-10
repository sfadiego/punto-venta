<?php

namespace App\Http\Controllers;

use App\Enums\BusinessTypeEnum;
use App\Enums\RoleEnum;
use App\Enums\SubscriptionStatusEnum;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\BusinessConfigModel;
use App\Models\User;
use Illuminate\Http\JsonResponse;
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
            rolId: $params->rol_id,
        );

        return Response::success(
            [
                'user' => $user->toArray(),
                'token' => $user->createToken('access_token')->plainTextToken,
            ]
        );
    }

    public function login(LoginRequest $params): JsonResponse
    {
        $result = User::login(
            email: $params->email,
            password: $params->password
        );

        if (! $result) {
            return Response::error(__('Credenciales no válidas.'));
        }

        if ($result['user']->rol_id === RoleEnum::SUPERADMIN->value) {
            $result['user']->tokens()->latest()->first()?->delete();

            return Response::error(__('Accede desde el panel de super administrador.'));
        }

        if ($params->filled('slug')) {
            $tenant = BusinessConfigModel::where(BusinessConfigModel::SLUG, $params->slug)->first();

            if (! $tenant || $result['user']->tenant_id !== $tenant->id) {
                $result['user']->tokens()->latest()->first()?->delete();

                return Response::error(__('Credenciales no válidas.'));
            }
        }

        $tenant = $result['user']->tenant;

        if ($tenant) {
            $status = $tenant->subscription_status;

            if (in_array($status, [SubscriptionStatusEnum::Expired->value, SubscriptionStatusEnum::Pending->value])) {
                $result['user']->tokens()->latest()->first()?->delete();

                $message = $status === SubscriptionStatusEnum::Pending->value
                    ? 'Este negocio aún no tiene una suscripción activa. Contacta al administrador para activar tu plan.'
                    : 'La suscripción de este negocio ha vencido. Contacta al administrador para renovarla.';

                return response()->json([
                    'success' => false,
                    'message' => $message,
                    'code'    => 'SUBSCRIPTION_EXPIRED',
                ], 403);
            }
        }

        $result['features'] = $tenant?->tipo_negocio->features() ?? BusinessTypeEnum::Restaurante->features();

        return Response::success($result);
    }
}
