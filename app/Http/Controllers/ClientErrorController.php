<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Models\ErrorReporting;
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

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'message'     => 'required|string|max:1000',
            'stack'       => 'nullable|string|max:5000',
            'url'         => 'nullable|string|max:500',
            'context'     => 'nullable|string|max:200',
            'level'       => 'nullable|string|max:20',
            'tenant_slug' => 'nullable|string|max:100',
            'user_id'     => 'nullable|integer',
            'usuario'     => 'nullable|string|max:100',
        ]);

        $tenantSlug = $request->input('tenant_slug', 'unknown');
        $context    = $request->input('context');
        $message    = $request->input('message');

        ErrorReporting::create([
            'source'          => 'frontend',
            'endpoint'        => $request->input('url', 'unknown'),
            'method'          => 'CLIENT',
            'status_code'     => 0,
            'error_message'   => $message,
            'request_payload' => [
                'stack'       => $request->input('stack'),
                'context'     => $context,
                'tenant_slug' => $tenantSlug,
                'user_id'     => $request->input('user_id'),
                'usuario'     => $request->input('usuario'),
            ],
            'response_body' => null,
            'user_agent'    => $request->userAgent(),
            'url'           => $request->input('url'),
        ]);

        // Log en archivo separado por cliente
        $clientLog = Log::build([
            'driver' => 'daily',
            'path'   => storage_path('logs/clients/' . $tenantSlug . '.log'),
            'days'   => 30,
            'level'  => 'debug',
        ]);

        $clientLog->error($message, [
            'context' => $context,
            'stack'   => $request->input('stack'),
            'url'     => $request->input('url'),
            'user_id' => $request->input('user_id'),
            'usuario' => $request->input('usuario'),
        ]);

        return Response::success(null, 201);
    }
}
