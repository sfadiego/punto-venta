<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TenantBranchStoreRequest;
use App\Http\Requests\TenantBranchUpdateRequest;
use App\Models\BranchModel;
use App\Models\BusinessConfigModel;
use App\Services\BranchActivationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

/**
 * Gestión de sucursales de un tenant desde el panel de SuperAdmin. La activación de la
 * feature (multi_branch_enabled) y la creación de sus sucursales iniciales son
 * exclusivas de SuperAdmin — mismo criterio de gobierno ya usado para printer_enabled
 * (ver CLAUDE.md). El tenant Admin sigue pudiendo administrar el día a día de las
 * sucursales ya creadas vía routes/modules/branches.php (renombrar, activar/desactivar,
 * asignar usuarios), pero no puede activarlas ni crear las iniciales por su cuenta.
 */
class TenantBranchController extends Controller
{
    public function index(BusinessConfigModel $tenant): JsonResponse
    {
        $branches = BranchModel::withoutGlobalScopes()
            ->where(BranchModel::TENANT_ID, $tenant->id)
            ->orderBy(BranchModel::NAME)
            ->get();

        return Response::success($branches);
    }

    public function store(BusinessConfigModel $tenant, TenantBranchStoreRequest $params): JsonResponse
    {
        $branch = BranchModel::create([
            BranchModel::NAME => $params->name,
            BranchModel::ADDRESS => $params->address,
            BranchModel::PHONE => $params->phone,
            BranchModel::ACTIVE => true,
            BranchModel::TENANT_ID => $tenant->id,
        ]);

        return Response::success($branch);
    }

    public function update(BusinessConfigModel $tenant, int $branch, TenantBranchUpdateRequest $params): JsonResponse
    {
        $model = BranchModel::withoutGlobalScopes()
            ->where(BranchModel::TENANT_ID, $tenant->id)
            ->findOrFail($branch);

        $model->update([
            BranchModel::NAME => $params->name,
            BranchModel::ADDRESS => $params->address,
            BranchModel::PHONE => $params->phone,
        ]);

        return Response::success($model);
    }

    public function enable(BusinessConfigModel $tenant, BranchActivationService $service): JsonResponse
    {
        $branch = $service->enable($tenant->id);

        return Response::success($branch, 'Sucursales activadas correctamente.');
    }

    /**
     * $branch se resuelve manualmente (no route-model-binding) y se re-filtra por
     * tenant_id explícito: el global scope de BranchModel es un no-op aquí (no hay
     * ResolveTenant en rutas de SuperAdmin), así que un binding implícito por {branch}
     * dejaría alternar la sucursal de CUALQUIER tenant con solo cambiar el ID en la URL.
     */
    public function toggleActive(BusinessConfigModel $tenant, int $branch): JsonResponse
    {
        $model = BranchModel::withoutGlobalScopes()
            ->where(BranchModel::TENANT_ID, $tenant->id)
            ->findOrFail($branch);

        if ($model->active && ($reason = $model->deactivationBlockReason())) {
            return Response::error($reason);
        }

        $model->update([BranchModel::ACTIVE => ! $model->active]);

        return Response::success($model);
    }
}
