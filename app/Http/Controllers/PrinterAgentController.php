<?php

namespace App\Http\Controllers;

use App\Core\Enums\Http;
use App\Http\Requests\PrinterAgentDownloadRequest;
use App\Services\PrinterAgentPackageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PrinterAgentController extends Controller
{
    public function download(PrinterAgentDownloadRequest $request, PrinterAgentPackageService $service): BinaryFileResponse|JsonResponse
    {
        $platform = $request->input('platform');
        $config = [
            'printer' => $request->input('printer'),
            'port' => $request->input('port', 8765),
        ];

        $zipPath = $service->buildZip($platform, $config);

        if (! $zipPath) {
            return Response::error('Binario no disponible. Contacta al administrador del sistema.', null, Http::NotFound);
        }

        $zipName = "print-agent-{$platform}.zip";

        return response()
            ->download($zipPath, $zipName, ['Content-Type' => 'application/zip'])
            ->deleteFileAfterSend();
    }
}
