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
        // Los features deshabilitados por el SuperAdmin para este tenant (ver
        // TenantFeatureSpotlightController) se tratan como "ya vistos" — así el
        // frontend no necesita distinguir entre "visto por el usuario" y
        // "deshabilitado para el tenant", ambos casos ocultan el spotlight igual.
        $seen = $this->featureSpotlightService->seenKeysForUser(auth()->id());
        $disabled = $this->featureSpotlightService->disabledKeysForTenant(app('tenant_id'));

        return Response::success(array_values(array_unique([...$seen, ...$disabled])));
    }

    public function markSeen(string $key): JsonResponse
    {
        if (! FeatureSpotlightEnum::tryFrom($key)) {
            return Response::error(__('Feature no reconocido.'));
        }

        $this->featureSpotlightService->markSeen(auth()->id(), app('tenant_id'), $key);

        return Response::success(true);
    }
}
