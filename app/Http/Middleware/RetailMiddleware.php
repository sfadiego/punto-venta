<?php

namespace App\Http\Middleware;

use App\Models\BusinessConfigModel;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate de funciones exclusivas de negocios tipo retail (ej. apartados). A diferencia de
 * RetailStockMiddleware no exige stock_enabled. Debe registrarse después de ResolveTenant para
 * que app('tenant_id') ya esté bindeado; se combina con PermissionMiddleware, no lo reemplaza.
 */
class RetailMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;
        $isRetail = BusinessConfigModel::find($tenantId)?->tipo_negocio?->features()['is_retail'] ?? false;

        if (! $isRetail) {
            return response()->json(['message' => 'Acceso no autorizado.'], 403);
        }

        return $next($request);
    }
}
