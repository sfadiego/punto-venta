<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TenantFeatureSpotlightUpdateRequest;
use App\Models\BusinessConfigModel;
use App\Services\FeatureSpotlightService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class TenantFeatureSpotlightController extends Controller
{
    public function __construct(private readonly FeatureSpotlightService $featureSpotlightService) {}

    public function index(BusinessConfigModel $tenant): JsonResponse
    {
        return Response::success($this->featureSpotlightService->checklistForTenant($tenant->id));
    }

    public function update(BusinessConfigModel $tenant, TenantFeatureSpotlightUpdateRequest $request): JsonResponse
    {
        $this->featureSpotlightService->syncTenantEnabled($tenant->id, $request->enabled_keys);

        return Response::success($this->featureSpotlightService->checklistForTenant($tenant->id));
    }
}
