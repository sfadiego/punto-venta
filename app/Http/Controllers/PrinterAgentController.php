<?php

namespace App\Http\Controllers;

use App\Core\Enums\Http;
use App\Services\PrinterAgentPackageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PrinterAgentController extends Controller
{
    public function download(Request $request, PrinterAgentPackageService $service): BinaryFileResponse|JsonResponse
    {
        $request->validate([
            'printer' => 'required|string|max:100',
            'port' => 'nullable|integer|min:1024|max:65535',
            'platform' => 'required|in:win,mac',
        ]);

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
