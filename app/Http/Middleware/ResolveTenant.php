<?php

namespace App\Http\Middleware;

use App\Enums\ApiErrorCodeEnum;
use App\Models\BusinessConfigModel;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ResolveTenant
{
    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        if ($user = $request->user()) {
            $tenant = BusinessConfigModel::find($user->tenant_id);

            // Un tenant borrado se trata como inactivo: el frontend solo cierra sesión con este código.
            if (! $tenant || ! $tenant->activo) {
                return Response::json([
                    'message' => 'La suscripción está desactivada. Contacta al administrador.',
                    'code' => ApiErrorCodeEnum::TenantInactive->value,
                ], 403);
            }

            app()->instance('tenant_id', $user->tenant_id);
        }

        return $next($request);
    }
}
