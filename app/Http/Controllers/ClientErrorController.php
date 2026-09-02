<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Core\Enums\Http;
use App\Http\Requests\ClientErrorStoreRequest;
use App\Http\Requests\ErrorReportingPruneRequest;
use App\Models\ErrorReporting;
use App\Services\ErrorReportingCleanupService;
use App\Services\ErrorReportingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

    public function store(ClientErrorStoreRequest $request): JsonResponse
    {
        $tenantSlug = $request->input('tenant_slug', 'unknown');
        $context = $request->input('context');
        $message = $request->input('message');
        $errorType = $request->input('error_type');
        $errorCode = $request->input('error_code');

        ErrorReporting::create([
            'source' => 'frontend',
            'endpoint' => $request->input('failed_endpoint') ?? $request->input('url', 'unknown'),
            'method' => $request->input('failed_method') ?? 'CLIENT',
            'status_code' => $request->input('failed_status') ?? 0,
            'error_message' => $message,
            'stack_trace' => $request->input('stack'),
            'user_id' => $request->input('user_id'),
            'tenant_slug' => $tenantSlug,
            'request_payload' => [
                'context' => $context,
                'usuario' => $request->input('usuario'),
                'error_type' => $errorType,
                'error_code' => $errorCode,
            ],
            'response_body' => null,
            'user_agent' => $request->userAgent(),
            'url' => $request->input('url'),
        ]);

        // Log en archivo separado por cliente
        $clientLog = Log::build([
            'driver' => 'daily',
            'path' => storage_path('logs/clients/'.$tenantSlug.'.log'),
            'days' => 30,
            'level' => 'debug',
        ]);

        $clientLog->error($message, [
            'context' => $context,
            'stack' => $request->input('stack'),
            'url' => $request->input('url'),
            'user_id' => $request->input('user_id'),
            'usuario' => $request->input('usuario'),
            'error_type' => $errorType,
            'error_code' => $errorCode,
        ]);

        return Response::success(null, null, Http::Created);
    }
}
