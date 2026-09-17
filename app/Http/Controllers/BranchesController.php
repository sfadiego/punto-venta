<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Http\Requests\BranchStoreRequest;
use App\Http\Requests\BranchSyncUsersRequest;
use App\Http\Requests\BranchUpdateRequest;
use App\Models\BranchModel;
use App\Models\User;
use App\Services\BranchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class BranchesController extends Controller
{
    public function index(IndexData $data, BranchService $service): JsonResponse
    {
        return $service->run($data);
    }

    /** Sucursales autorizadas para el usuario autenticado — para selectores (apertura de caja, formulario de producto). */
    public function list(): JsonResponse
    {
        $branchIds = auth()->user()->authorizedBranchIds();

        $branches = BranchModel::whereIn('id', $branchIds)
            ->where(BranchModel::ACTIVE, true)
            ->orderBy(BranchModel::NAME)
            ->get(['id', 'name', 'address']);

        return Response::success($branches);
    }

    public function store(BranchStoreRequest $params): JsonResponse
    {
        $branch = BranchModel::create([
            BranchModel::NAME => $params->name,
            BranchModel::ADDRESS => $params->address,
            BranchModel::PHONE => $params->phone,
            BranchModel::ACTIVE => $params->boolean(BranchModel::ACTIVE, true),
        ]);

        return Response::success($branch);
    }

    public function show(BranchModel $branch): JsonResponse
    {
        return Response::success($branch->load('users:id,nombre,apellido_paterno,email'));
    }

    public function update(BranchModel $branch, BranchUpdateRequest $params): JsonResponse
    {
        $deactivating = $branch->active && ! $params->boolean(BranchModel::ACTIVE, $branch->active);

        if ($deactivating && ($reason = $branch->deactivationBlockReason())) {
            return Response::error($reason);
        }

        $branch->update([
            BranchModel::NAME => $params->name,
            BranchModel::ADDRESS => $params->address,
            BranchModel::PHONE => $params->phone,
            BranchModel::ACTIVE => $params->boolean(BranchModel::ACTIVE, $branch->active),
        ]);

        return Response::success($branch);
    }

    public function delete(BranchModel $branch): JsonResponse
    {
        if ($branch->active && ($reason = $branch->deactivationBlockReason('eliminar'))) {
            return Response::error($reason);
        }

        return Response::success($branch->delete());
    }

    /** Reemplaza el set completo de usuarios con acceso a esta sucursal. */
    public function syncUsers(BranchModel $branch, BranchSyncUsersRequest $params): JsonResponse
    {
        $currentUserIds = $branch->users()->pluck('users.id')->all();
        $removedUserIds = array_diff($currentUserIds, $params->user_ids);

        foreach (User::whereIn('id', $removedUserIds)->get() as $removedUser) {
            if ($reason = $removedUser->blockRemovingBranchesReason([$branch->id])) {
                return Response::error($reason);
            }
        }

        // user_branch no usa HasTenant (es tabla pivote) — tenant_id debe ir explícito
        // en cada fila o la inserción falla contra la restricción NOT NULL.
        $pivotData = collect($params->user_ids)
            ->mapWithKeys(fn ($userId) => [$userId => [BranchModel::TENANT_ID => $branch->tenant_id]]);

        $branch->users()->sync($pivotData);

        return Response::success($branch->load('users:id,nombre,apellido_paterno,email'));
    }
}
