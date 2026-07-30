<?php

namespace App\Http\Middleware;

use App\Enums\RoleEnum;
use App\Services\RolePermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A diferencia de AdminOnlyMiddleware, no exige rol Admin — permite el paso si el rol
 * del usuario tiene el permiso indicado otorgado en "Roles y permisos" (role_permissions).
 * Admin siempre pasa. Uso: ->middleware('permission:viewUsers').
 */
class PermissionMiddleware
{
    public function __construct(private readonly RolePermissionService $rolePermissionService) {}

    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Acceso no autorizado.'], 403);
        }

        if ($user->rol_id === RoleEnum::ADMIN->value) {
            return $next($request);
        }

        $granted = $this->rolePermissionService->grantedKeys($user->rol_id);

        if (! in_array($permission, $granted, true)) {
            return response()->json(['message' => 'Acceso no autorizado.'], 403);
        }

        return $next($request);
    }
}
