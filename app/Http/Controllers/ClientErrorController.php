<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Models\ErrorReporting;
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

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'stack'   => 'nullable|string|max:5000',
            'url'     => 'nullable|string|max:500',
        ]);

        ErrorReporting::create([
            'source'          => 'frontend',
            'endpoint'        => $request->input('url', 'unknown'),
            'method'          => 'CLIENT',
            'status_code'     => 0,
            'error_message'   => $request->input('message'),
            'request_payload' => ['stack' => $request->input('stack')],
            'response_body'   => null,
            'user_agent'      => $request->userAgent(),
            'url'             => $request->input('url'),
        ]);

        return Response::success(null, 201);
    }
}
