<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Http\Requests\AddonStoreRequest;
use App\Http\Requests\AddonSyncProductsRequest;
use App\Http\Requests\AddonUpdateRequest;
use App\Models\AddonModel;
use App\Services\AddonAssignmentService;
use App\Services\AddonService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class AddonController extends Controller
{
    public function index(IndexData $data, AddonService $service): JsonResponse
    {
        return $service->run($data);
    }

    /** Versión ligera sin paginar (solo activos) para checklists/pickers. */
    public function list(): JsonResponse
    {
        return Response::success(
            AddonModel::where(AddonModel::IS_ACTIVE, true)
                ->orderBy(AddonModel::NAME)
                ->get()
        );
    }

    public function store(AddonStoreRequest $param): JsonResponse
    {
        $addon = AddonModel::create([
            AddonModel::NAME => $param->name,
            AddonModel::PRICE => $param->price ?? 0,
            AddonModel::IS_ACTIVE => $param->has('is_active') ? (bool) $param->is_active : true,
        ]);

        return Response::success($addon->refresh());
    }

    public function show(AddonModel $addon, AddonAssignmentService $assignmentService): JsonResponse
    {
        return Response::success($assignmentService->withProductIds($addon));
    }

    /** Reemplaza el conjunto de productos donde se ofrece el topping (asignación masiva desde el catálogo). */
    public function syncProducts(AddonModel $addon, AddonSyncProductsRequest $param, AddonAssignmentService $assignmentService): JsonResponse
    {
        return Response::success($assignmentService->syncProducts($addon, $param->product_ids));
    }

    public function update(AddonModel $addon, AddonUpdateRequest $param): JsonResponse
    {
        $addon->update($param->validated());

        return Response::success($addon->refresh());
    }

    public function delete(AddonModel $addon): JsonResponse
    {
        return Response::success($addon->delete());
    }
}
