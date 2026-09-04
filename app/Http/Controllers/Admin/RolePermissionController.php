<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\RolePermissionSyncRequest;
use App\Services\RolePermissionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class RolePermissionController extends Controller
{
    public function __construct(private readonly RolePermissionService $rolePermissionService) {}

    public function index(): JsonResponse
    {
        return Response::success(
            $this->rolePermissionService->grantedMapForTenant(app('tenant_id'))
        );
    }

    public function update(int $role, RolePermissionSyncRequest $request): JsonResponse
    {
        if ($error = $this->rolePermissionService->validateRoleConfigurable(app('tenant_id'), $role)) {
            return Response::error(__($error));
        }

        $this->rolePermissionService->sync($role, $request->permissions);

        return Response::success($this->rolePermissionService->grantedKeys($role));
    }
}
