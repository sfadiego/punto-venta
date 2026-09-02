<?php

namespace App\Printer\Formatters;

use App\Printer\Dto\TicketDataInterface;
use App\Printer\Interface\TicketFormatterInterface;
use Mike42\Escpos\Printer;

/**
 * Ticket de prueba del agente de impresión (PrintController::testBytes) — confirma que el
 * agente local está enlazado y puede escribir en la impresora, sin datos de una venta real.
 */
class TestTicketFormatter implements TicketFormatterInterface
{
    public function format(TicketDataInterface $data, Printer $printer): void
    {
        $d = $data->toArray();

        $chars = VentaFormatter::charsForPaperWidth($d['paper_width']);
        $line = str_repeat('=', $chars);
        $dline = str_repeat('-', $chars);
        $now = now()->setTimezone(config('app.timezone'));

        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->setTextSize(1, 2);
        $printer->text("PRUEBA DE IMPRESION\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->text($line."\n");

        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->text('Negocio : '.$d['business_name']."\n");
        $printer->text('Fecha   : '.$now->format('d/m/Y H:i:s')."\n");
        $printer->text($dline."\n");

        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->text("Agente de impresion: OK\n");
        $printer->setEmphasis(false);
        $printer->text("Sistema POS\n");
        $printer->text($line."\n");
        $printer->feed(4);
    }
}
