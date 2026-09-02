<?php

namespace App\Printer\Connectors;

use App\Models\BusinessConfigModel;
use App\Printer\Interface\PrinterConnectorInterface;
use Illuminate\Support\Facades\Log;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\Printer;

class NetworkConnector implements PrinterConnectorInterface
{
    protected NetworkPrintConnector $connector;

    protected Printer $printer;

    protected string $printerName;

    protected string $printerHost;

    /** @var resource|null */
    protected $socketConection = null;

    public function __construct(BusinessConfigModel $tenant)
    {
        $this->printerName = $tenant->printer_name ?? config('printer.name');
        $this->printerHost = $tenant->printer_host ?? config('printer.host');
    }

    public function init(): void
    {
        if (! $this->isActiveConnection()) {
            return;
        }
        $this->connector = new NetworkPrintConnector($this->printerHost);
        $this->printer = new Printer($this->connector);
    }

    public function initialize(): void
    {
        $this->printer->initialize();
    }

    public function write(string $data): void
    {
        $this->printer->text($data);
    }

    public function cut(): void
    {
        $this->printer->cut();
    }

    public function pulse(): void
    {
        $this->printer->pulse();
    }

    public function close(): void
    {
        $this->printer->close();
        if ($this->socketConection) {
            fclose($this->socketConection);
        }
    }

    public function getPrinter(): Printer
    {
        return $this->printer;
    }

    public function isActiveConnection(): bool
    {
        $this->socketConection = @fsockopen($this->printerHost, 9100, $errno, $errstr, 1.5);
        if (! $this->socketConection) {
            Log::info('Impresora no conectada');

            return false;
        }

        return true;
    }
}
