<?php

namespace App\Printer\Formatters;

use App\Enums\OrderStatusEnum;
use Mike42\Escpos\Printer;

/**
 * Comprobante de apartado: el ticket de venta normal con un título según el estado del apartado y,
 * tras los totales, el cliente, el historial de abonos y el saldo pendiente.
 */
class LayawayFormatter extends VentaFormatter
{
    protected function headerExtra(Printer $printer, array $d): void
    {
        $title = match ($d['layaway']['status']) {
            OrderStatusEnum::CLOSED->value => 'APARTADO LIQUIDADO',
            OrderStatusEnum::CANCELED->value => 'APARTADO CANCELADO',
            default => 'COMPROBANTE DE APARTADO',
        };

        $printer->setEmphasis(true);
        $printer->text($title."\n");
        $printer->setEmphasis(false);
        $printer->feed(1);
    }

    protected function afterTotals(Printer $printer, array $d): void
    {
        $layaway = $d['layaway'];

        $printer->feed(1);
        $printer->text($this->line('-')."\n");
        $printer->setJustification(Printer::JUSTIFY_LEFT);

        if ($layaway['customer_name']) {
            $printer->text('Cliente: '.mb_substr($layaway['customer_name'], 0, $this->width - 9)."\n");
        }

        $printer->setEmphasis(true);
        $printer->text("ABONOS\n");
        $printer->setEmphasis(false);

        foreach ($layaway['payments'] as $payment) {
            // El retenido no mueve efectivo (ya se cobró en un abono): se imprime sin signo.
            $label = $payment['fecha'].' '.($payment['is_forfeit'] ? 'Retenido' : ($payment['is_refund'] ? 'Reembolso' : ($payment['method'] ?: 'Abono')));
            $amount = ($payment['is_forfeit'] ? '$' : ($payment['is_refund'] ? '-$' : '+$')).number_format($payment['amount'], 2);
            $printer->text($this->totalRow(mb_substr($label, 0, $this->colName), $amount)."\n");
        }

        $printer->text($this->line('-')."\n");

        if ($layaway['status'] === OrderStatusEnum::CANCELED->value) {
            return;
        }

        $printer->text($this->totalRow('Abonado:', '$'.number_format($layaway['amount_paid'], 2))."\n");
        $printer->setEmphasis(true);
        $printer->text($this->totalRow('SALDO PENDIENTE:', '$'.number_format($layaway['pending'], 2))."\n");
        $printer->setEmphasis(false);

        if ($layaway['status'] === OrderStatusEnum::LAYAWAY->value && $layaway['due_date']) {
            $printer->text('Fecha limite: '.$layaway['due_date']."\n");
        }
    }
}
