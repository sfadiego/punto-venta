<?php

namespace App\Printer\Connectors;

use App\Models\BusinessConfigModel;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\Printer;

class FileConnector extends AbstractConnector
{
    protected $fileName;

    protected $tempFile = null;

    protected $host;

    public function __construct(BusinessConfigModel $tenant)
    {
        parent::__construct($tenant);
        $this->fileName = 'ticket';
        $this->host = $tenant->printer_host ?? config('printer.host');
        $this->tempFile = tempnam(sys_get_temp_dir(), 'ticket-');
    }

    public function init(): void
    {
        $this->connector = new FilePrintConnector($this->tempFile);
        $this->printer = new Printer($this->connector);
    }

    public function close(): void
    {
        $this->printer->close();
    }
}
