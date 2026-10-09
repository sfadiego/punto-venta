<?php

namespace App\Printer\Formatters;

use App\Printer\Dto\TicketDataInterface;
use Mike42\Escpos\Printer;

/**
 * Comprobante de devolución: folio de la venta, motivo, productos devueltos con su reembolso y cómo se
 * devolvió el dinero (método de pago y/o saldo del cliente). Comparte encabezado, pie y columnas con el
 * ticket de venta.
 */
class ReturnFormatter extends VentaFormatter
{
    public function format(TicketDataInterface $data, Printer $printer): void
    {
        $d = $data->toArray();
        $business = $d['business'];
        $this->setUpColumns($business);

        // ─── Encabezado ───────────────────────────────────────
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->text($business['name']."\n");
        $printer->setEmphasis(false);
        $printer->feed(1);
        $printer->text($d['fecha_string'].'  '.$d['hora']."\n");
        $printer->feed(1);
        $printer->setEmphasis(true);
        $printer->text("COMPROBANTE DE DEVOLUCION\n");
        $printer->setEmphasis(false);
        $printer->text($this->line('=')."\n");

        // ─── Datos de la devolución ───────────────────────────
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->text('Venta: '.$this->folioPrefix($business['name']).'-'.str_pad((string) $d['order_id'], 4, '0', STR_PAD_LEFT)."\n");
        if ($d['customer_name']) {
            $printer->text('Cliente: '.mb_substr($d['customer_name'], 0, $this->width - 9)."\n");
        }
        $printer->text('Motivo: '.mb_substr($d['reason'], 0, $this->width - 8)."\n");
        if ($d['attended_by']) {
            $printer->text('Atendio: '.mb_substr($d['attended_by'], 0, $this->width - 9)."\n");
        }
        $printer->feed(1);

        // ─── Productos devueltos ──────────────────────────────
        $printer->text($this->line('-')."\n");
        $printer->setEmphasis(true);
        $printer->text(str_pad('DEVUELTO', $this->colName).str_pad('REEMBOLSO', $this->colTotal, ' ', STR_PAD_LEFT)."\n");
        $printer->setEmphasis(false);
        $printer->text($this->line('-')."\n");

        foreach ($d['items'] as $item) {
            $printer->text($this->itemLine($item)."\n");
        }

        // ─── Reembolso ────────────────────────────────────────
        $printer->text($this->line('=')."\n");

        if ($d['refund_amount'] <= 0) {
            $printer->setEmphasis(true);
            $printer->text("SIN REEMBOLSO\n");
            $printer->setEmphasis(false);
            // Cabe en 32 columnas (papel de 58 mm). Una defectuosa no vuelve al inventario: se da de baja.
            $printer->text(($d['returns_to_stock'] ?? true ? 'Piezas devueltas al inventario' : 'Piezas dadas de baja (merma)')."\n");
        } else {
            $printer->setEmphasis(true);
            $printer->text($this->totalRow('TOTAL REEMBOLSADO:', '$'.number_format($d['refund_amount'], 2))."\n");
            $printer->setEmphasis(false);

            if ($d['method_amount'] > 0) {
                $printer->text($this->totalRow('  '.mb_substr($d['method_name'] ?? 'Reembolso', 0, $this->colName - 4).':', '$'.number_format($d['method_amount'], 2))."\n");
            }
            if ($d['balance_applied'] > 0) {
                $printer->text($this->totalRow('  Saldo del cliente:', '$'.number_format($d['balance_applied'], 2))."\n");
            }
        }

        if ($d['note']) {
            $printer->feed(1);
            $printer->text('Nota: '.$d['note']."\n");
        }

        $this->printFooter($printer, $business);
    }

    /**
     * Producto devuelto en dos líneas:
     * "Aretes de plata 925      $149"  ← nombre + reembolso
     * "  1 pza"                       ← cantidad devuelta (con decimales y unidad si es peso)
     */
    private function itemLine(array $item): string
    {
        $name = mb_substr($item['nombre'], 0, $this->colName);
        // ASCII: la impresora térmica no tiene el guion largo y lo imprime como un símbolo roto.
        $refund = $item['refund'] > 0 ? '$'.number_format($item['refund'], 2) : '-';

        $esPeso = in_array($item['unidad_medida'], ['kg', 'gr', 'litro'], true);
        $quantity = $esPeso
            ? rtrim(rtrim(number_format($item['cantidad'], 3, '.', ''), '0'), '.').' '.$item['unidad_medida']
            : (int) $item['cantidad'].' pza';

        return str_pad($name, $this->colName).str_pad($refund, $this->colTotal, ' ', STR_PAD_LEFT)."\n  ".$quantity;
    }
}
