<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\RolePermissionSyncRequest;
use App\Models\BusinessConfigModel;
use App\Services\RolePermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class TenantRolePermissionController extends Controller
{
    public function __construct(private readonly RolePermissionService $rolePermissionService) {}

    public function index(BusinessConfigModel $tenant): JsonResponse
    {
        return Response::success($this->rolePermissionService->grantedMapForTenant($tenant->id));
    }

    public function update(BusinessConfigModel $tenant, int $role, RolePermissionSyncRequest $request): JsonResponse
    {
        if ($error = $this->rolePermissionService->validateRoleConfigurable($tenant->id, $role)) {
            return Response::error(__($error));
        }

        $this->rolePermissionService->sync($role, $request->permissions, $tenant->id);

        return Response::success($this->rolePermissionService->grantedMapForTenant($tenant->id));
    }
}
