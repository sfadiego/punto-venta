<?php

namespace App\Printer\Service;

use App\Printer\Dto\TicketDataInterface;
use App\Printer\Interface\PrinterConnectorInterface;
use App\Printer\Interface\TicketFormatterInterface;

class PrinterService
{
    protected PrinterConnectorInterface $connector;

    protected TicketFormatterInterface $formatter;

    public function __construct(PrinterConnectorInterface $connector, TicketFormatterInterface $formatter)
    {
        $this->connector = $connector;
        $this->formatter = $formatter;
    }

    public function printTicket(TicketDataInterface $ticketData): void
    {
        $this->connector->init();
        $printer = $this->connector->getPrinter();
        $this->connector->initialize();
        $this->formatter->format($ticketData, $printer);
        $this->connector->cut();
        $this->connector->close();
    }

    /** Manda solo el pulso de apertura del cajón (sin imprimir ni cortar nada). */
    public function openCashDrawer(): void
    {
        $this->connector->init();
        $this->connector->initialize();
        $this->connector->pulse();
        $this->connector->close();
    }
}
