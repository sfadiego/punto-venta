<?php

namespace App\Printer\Connectors;

use Mike42\Escpos\PrintConnectors\DummyPrintConnector;
use Mike42\Escpos\Printer;

class SmbclientConnector extends AbstractConnector
{
    public function init(): void
    {
        $this->connector = new DummyPrintConnector;
        $this->printer = new Printer($this->connector);
    }

    public function close(): void
    {
        if (! $this->connector) {
            return;
        }

        $data = $this->connector->getData();
        $host = 'host.docker.internal';
        $port = 9100;

        try {
            // Intentamos enviar por TCP directo (Puente de red)
            $fp = @fsockopen($host, $port, $errno, $errstr, 5);

            if ($fp) {
                fwrite($fp, $data);
                fclose($fp);
            } else {
                // Si el puente no está activo, intentamos el método SMB original (para Windows)
                $this->printViaSmb($data);
            }
        } catch (\Exception $e) {
            throw new \Exception('Error de impresión: '.$e->getMessage());
        }

        $this->connector->finalize();
    }

    protected function printViaSmb($data): void
    {
        $host = 'host.docker.internal';
        $command = sprintf(
            'smbclient //%s/%s -U %s -m SMB2 -c "print -"',
            $host,
            escapeshellarg($this->printerName),
            escapeshellarg(config('printer.smb_user').'%'.config('printer.smb_pass'))
        );

        $handle = popen($command, 'w');
        if ($handle) {
            fwrite($handle, $data);
            pclose($handle);
        }
    }
}
