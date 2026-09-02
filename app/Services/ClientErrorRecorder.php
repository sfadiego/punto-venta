<?php

namespace App\Services;

use App\Http\Requests\ClientErrorStoreRequest;
use App\Models\ErrorReporting;
use Illuminate\Support\Facades\Log;

/**
 * Registra un error reportado por el frontend: guarda el registro en BD (para el panel de
 * SuperAdmin, vía ErrorReportingService) y además lo escribe en un log de archivo separado
 * por tenant, para diagnóstico rápido sin tener que entrar al panel.
 *
 * No se agrega como método de ErrorReportingService a propósito — ese service extiende
 * DataTable (listado paginado) y el proyecto no mezcla ese patrón con lógica de negocio.
 */
class ClientErrorRecorder
{
    public function record(ClientErrorStoreRequest $request): void
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
    }
}
