<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Core\Enums\Http;
use App\Http\Requests\ClientErrorStoreRequest;
use App\Http\Requests\ErrorReportingPruneRequest;
use App\Services\ClientErrorRecorder;
use App\Services\ErrorReportingCleanupService;
use App\Services\ErrorReportingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class ClientErrorController extends Controller
{
    public function index(Request $request, IndexData $data, ErrorReportingService $service): JsonResponse
    {
        $source = $request->query('source');

        return $service->run($data, $source ?: null);
    }

    public function prune(ErrorReportingPruneRequest $request, ErrorReportingCleanupService $service): JsonResponse
    {
        $days = $request->validated('days') ?? 90;
        $deleted = $service->pruneOlderThan((int) $days);

        return Response::success(['deleted' => $deleted]);
    }

    public function store(ClientErrorStoreRequest $request, ClientErrorRecorder $recorder): JsonResponse
    {
        $recorder->record($request);

        return Response::success(null, null, Http::Created);
    }
}
