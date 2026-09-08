<?php

namespace App\Http\Middleware;

use App\Models\BusinessConfigModel;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Gate del módulo de Inventario (kardex global, devolución, reajuste desde la página de
 * Inventario) — exclusivo de negocios tipo retail con stock_enabled activo. Debe registrarse
 * después de ResolveTenant en la cadena de middleware para que app('tenant_id') ya esté
 * bindeado. No reemplaza a PermissionMiddleware: se combinan (permiso de rol + tipo de negocio).
 */
class RetailStockMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenantId = app()->bound('tenant_id') ? app('tenant_id') : null;
        $config = BusinessConfigModel::find($tenantId);

        $isRetail = $config?->tipo_negocio?->features()['is_retail'] ?? false;
        $stockEnabled = $config?->stock_enabled ?? false;

        if (! $isRetail || ! $stockEnabled) {
            return response()->json(['message' => 'Acceso no autorizado.'], 403);
        }

        return $next($request);
    }
}
