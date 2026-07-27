<?php

namespace App\Http\Controllers;

use App\Enums\FeatureSpotlightEnum;
use App\Services\FeatureSpotlightService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class FeatureSpotlightController extends Controller
{
    public function __construct(private readonly FeatureSpotlightService $featureSpotlightService) {}

    public function index(): JsonResponse
    {
        return Response::success($this->featureSpotlightService->seenKeysForUser(auth()->id()));
    }

    public function markSeen(string $key): JsonResponse
    {
        if (! FeatureSpotlightEnum::tryFrom($key)) {
            return Response::error(__('Feature no reconocido.'));
        }

        $this->featureSpotlightService->markSeen(auth()->id(), $key);

        return Response::success(true);
    }
}
