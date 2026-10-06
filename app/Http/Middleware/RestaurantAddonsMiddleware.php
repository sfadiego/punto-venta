<?php

namespace App\Http\Middleware;

use App\Models\BusinessConfigModel;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate del catálogo de toppings — exclusivo de negocios tipo restaurante/cafetería (los que
 * tienen kitchen_view, ver BusinessTypeEnum::features()). Debe registrarse después de
 * ResolveTenant para que app('tenant_id') ya esté bindeado. No reemplaza a role.admin ni a
 * PermissionMiddleware: se combinan (permiso de rol + tipo de negocio).
 */
class RestaurantAddonsMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;

        if (! BusinessConfigModel::supportsAddons($tenantId)) {
            return response()->json(['message' => 'Acceso no autorizado.'], 403);
        }

        return $next($request);
    }
}
