<?php

namespace App\Http\Controllers\Admin;

use App\Enums\RoleEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\RolePermissionSyncRequest;
use App\Models\BusinessConfigModel;
use App\Services\RolePermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class RolePermissionController extends Controller
{
    private const CONFIGURABLE_ROLES = [RoleEnum::EMPLOYE->value, RoleEnum::COCINA->value, RoleEnum::CAJA->value];

    public function __construct(private readonly RolePermissionService $rolePermissionService) {}

    public function index(): JsonResponse
    {
        return Response::success(
            $this->rolePermissionService->grantedMapForTenant(app('tenant_id'))
        );
    }

    public function update(int $role, RolePermissionSyncRequest $request): JsonResponse
    {
        if (! in_array($role, self::CONFIGURABLE_ROLES, true)) {
            return Response::error(__('Este rol no es configurable.'));
        }

        // Cocina y Caja no existen como roles asignables en negocios de venta por peso
        // (sin kitchen_view, sin flujo de caja separado del empleado) — ver
        // useUsersPage.ts:24 en el frontend, que ya excluye estos roles al crear usuarios.
        $sellByWeight = BusinessConfigModel::find(app('tenant_id'))?->tipo_negocio->features()['sell_by_weight'] ?? false;
        $rolesSinVentaPorPeso = [RoleEnum::COCINA->value, RoleEnum::CAJA->value];

        if ($sellByWeight && in_array($role, $rolesSinVentaPorPeso, true)) {
            return Response::error(__('Este rol no está disponible para negocios de venta por peso.'));
        }

        $this->rolePermissionService->sync($role, $request->permissions);

        return Response::success($this->rolePermissionService->grantedKeys($role));
    }
}
