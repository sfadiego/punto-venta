<?php

namespace App\Printer\Connectors;

use App\Models\BusinessConfigModel;
use App\Printer\Interface\PrinterConnectorInterface;
use Mike42\Escpos\Printer;

abstract class AbstractConnector implements PrinterConnectorInterface
{
    protected $connector;

    protected Printer $printer;

    protected string $printerName;

    public function __construct(BusinessConfigModel $tenant)
    {
        $this->printerName = $tenant->printer_name ?? config('printer.name');
    }

    abstract public function init(): void;

    public function initialize(): void
    {
        $this->printer->initialize();
    }

    public function isActiveConnection(): bool
    {
        return true;
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
    }

    public function getPrinter(): Printer
    {
        return $this->printer;
    }
}
