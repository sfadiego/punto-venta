<?php

namespace App\Http\Middleware;

use App\Enums\RoleEnum;
use App\Services\RolePermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * A diferencia de AdminOnlyMiddleware, no exige rol Admin — permite el paso si el rol
 * del usuario tiene alguno de los permisos indicados otorgado en "Roles y permisos"
 * (role_permissions). Admin siempre pasa. Uso: ->middleware('permission:viewUsers') o,
 * cuando dos flujos de UI con permisos distintos legítimamente llegan al mismo endpoint
 * (ej. TakeOrder vs QuickSale), ->middleware('permission:takeOrder,viewOrders') — pasa
 * con cualquiera de los dos (OR), no exige ambos.
 */
class PermissionMiddleware
{
    public function __construct(private readonly RolePermissionService $rolePermissionService) {}

    public function handle(Request $request, Closure $next, string ...$permissions): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Acceso no autorizado.'], 403);
        }

        if ($user->rol_id === RoleEnum::ADMIN->value) {
            return $next($request);
        }

        $granted = $this->rolePermissionService->grantedKeys($user->rol_id);

        if (array_intersect($permissions, $granted) === []) {
            return response()->json(['message' => 'Acceso no autorizado.'], 403);
        }

        return $next($request);
    }
}
