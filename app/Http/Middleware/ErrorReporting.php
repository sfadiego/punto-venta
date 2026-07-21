<?php

namespace App\Http\Middleware;

use App\Models\ErrorReporting as ModelsErrorReporting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ErrorReporting
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $status = $response->getStatusCode();
        $exception = $response->exception;

        if ($status === 500) {
            Log::error('Fatal Error', [
                'endpoint' => $request->path(),
                'method'   => $request->method(),
                'error_message' => $exception?->getMessage() ?? 'Unknown error',
                'stack_trace'   => $exception?->getTraceAsString(),
                'user_id'       => $request->user()?->id,
            ]);
        }

        if ($status > 400) {
            try {
                ModelsErrorReporting::create([
                    'source'          => 'backend',
                    'endpoint'        => $request->path(),
                    'method'          => $request->method(),
                    'status_code'     => $status,
                    'error_message'   => $exception?->getMessage() ?? 'Unknown error',
                    'stack_trace'     => $exception?->getTraceAsString(),
                    'user_id'         => $request->user()?->id,
                    'tenant_slug'     => $request->user()?->tenant?->slug,
                    'request_payload' => $request->except(['password', 'password_confirmation']),
                    'response_body'   => $response->getContent(),
                    'user_agent'      => $request->userAgent(),
                    'url'             => $request->fullUrl(),
                ]);
            } catch (\Throwable) {
                // Never let error reporting itself crash the response
            }
        }

        return $response;
    }
}
