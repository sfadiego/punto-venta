<?php

namespace App\Services;

use ZipArchive;

/**
 * Arma el ZIP descargable del agente de impresión local (binario + config.json +
 * README/scripts de soporte según la plataforma).
 */
class PrinterAgentPackageService
{
    /**
     * @return string|null Ruta del ZIP generado, o null si el binario para esa
     *                      plataforma no está disponible en el storage.
     */
    public function buildZip(string $platform, array $config): ?string
    {
        $binaryName = $platform === 'win' ? 'print-agent-win.exe' : 'print-agent-macos';
        $binaryPath = storage_path("app/printer-agent/{$binaryName}");

        if (! file_exists($binaryPath)) {
            return null;
        }

        $configJson = json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        $zipPath = sys_get_temp_dir().'/print-agent-'.uniqid().'.zip';
        $zip = new ZipArchive;
        $zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE);

        $executableName = $platform === 'win' ? 'print-agent.exe' : 'print-agent';
        $zip->addFile($binaryPath, $executableName);
        $zip->addFromString('config.json', $configJson);

        if ($platform === 'mac') {
            $zip->addFromString('README.md', $this->macReadme());
        }

        if ($platform === 'win') {
            $this->addWindowsBatFiles($zip);
        }

        $zip->close();

        return $zipPath;
    }

    private function macReadme(): string
    {
        return "# Agente de impresión — macOS\n\n"
            ."## Instalación\n\n"
            ."1. Coloca `print-agent` y `config.json` en la misma carpeta.\n"
            ."2. Abre **Terminal** en esa carpeta y ejecuta los siguientes comandos:\n\n"
            ."   ```bash\n"
            ."   # Quitar bloqueo de Gatekeeper (se ejecuta una sola vez)\n"
            ."   xattr -rd com.apple.quarantine ./print-agent\n"
            ."   chmod +x ./print-agent\n\n"
            ."   # Iniciar el agente\n"
            ."   ./print-agent\n"
            ."   ```\n\n"
            ."3. El agente quedará escuchando en el puerto indicado en `config.json`.\n\n"
            ."## ¿Por qué macOS bloquea el archivo?\n\n"
            ."macOS Gatekeeper bloquea ejecutables que no están firmados con un certificado de Apple.\n"
            ."El comando `xattr -rd com.apple.quarantine` elimina esa restricción de forma segura.\n\n"
            ."> **Nota:** los ejecutables macOS no llevan extensión `.exe`. El ícono \"exec\" indica que el archivo es correcto.\n";
    }

    private function addWindowsBatFiles(ZipArchive $zip): void
    {
        $batFiles = ['limpiar-cola.bat', 'restart-spooler.bat', 'diagnostico-impresora.bat'];
        foreach ($batFiles as $bat) {
            $batPath = base_path("printer-agent/{$bat}");
            if (file_exists($batPath)) {
                $zip->addFile($batPath, $bat);
            }
        }
    }
}
