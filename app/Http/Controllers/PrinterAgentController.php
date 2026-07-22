<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use ZipArchive;

class PrinterAgentController extends Controller
{
    public function download(Request $request): BinaryFileResponse|JsonResponse
    {
        $request->validate([
            'printer' => 'required|string|max:100',
            'port' => 'nullable|integer|min:1024|max:65535',
            'platform' => 'required|in:win,mac',
        ]);

        $platform = $request->input('platform');
        $binaryName = $platform === 'win' ? 'print-agent-win.exe' : 'print-agent-macos';
        $binaryPath = storage_path("app/printer-agent/{$binaryName}");

        if (! file_exists($binaryPath)) {
            return Response::json(['message' => 'Binario no disponible. Contacta al administrador del sistema.'], 404);
        }

        $config = json_encode([
            'printer' => $request->input('printer'),
            'port' => $request->input('port', 8765),
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $zipPath = sys_get_temp_dir().'/print-agent-'.uniqid().'.zip';
        $zip = new ZipArchive;
        $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        $executableName = $platform === 'win' ? 'print-agent.exe' : 'print-agent';
        $zip->addFile($binaryPath, $executableName);
        $zip->addFromString('config.json', $config);

        if ($platform === 'mac') {
            $readme = "# Agente de impresión — macOS\n\n"
                . "## Instalación\n\n"
                . "1. Coloca `print-agent` y `config.json` en la misma carpeta.\n"
                . "2. Abre **Terminal** en esa carpeta y ejecuta los siguientes comandos:\n\n"
                . "   ```bash\n"
                . "   # Quitar bloqueo de Gatekeeper (se ejecuta una sola vez)\n"
                . "   xattr -rd com.apple.quarantine ./print-agent\n"
                . "   chmod +x ./print-agent\n\n"
                . "   # Iniciar el agente\n"
                . "   ./print-agent\n"
                . "   ```\n\n"
                . "3. El agente quedará escuchando en el puerto indicado en `config.json`.\n\n"
                . "## ¿Por qué macOS bloquea el archivo?\n\n"
                . "macOS Gatekeeper bloquea ejecutables que no están firmados con un certificado de Apple.\n"
                . "El comando `xattr -rd com.apple.quarantine` elimina esa restricción de forma segura.\n\n"
                . "> **Nota:** los ejecutables macOS no llevan extensión `.exe`. El ícono \"exec\" indica que el archivo es correcto.\n";
            $zip->addFromString('README.md', $readme);
        }

        if ($platform === 'win') {
            $batFiles = ['limpiar-cola.bat', 'restart-spooler.bat', 'diagnostico-impresora.bat'];
            foreach ($batFiles as $bat) {
                $batPath = base_path("printer-agent/{$bat}");
                if (file_exists($batPath)) {
                    $zip->addFile($batPath, $bat);
                }
            }
        }

        $zip->close();

        $zipName = "print-agent-{$platform}.zip";

        return response()
            ->download($zipPath, $zipName, ['Content-Type' => 'application/zip'])
            ->deleteFileAfterSend();
    }
}
