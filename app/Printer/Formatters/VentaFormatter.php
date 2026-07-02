<?php

namespace App\Printer\Formatters;

use App\Printer\Dto\TicketDataInterface;
use App\Printer\Interface\TicketFormatterInterface;
use Mike42\Escpos\Printer;

class VentaFormatter implements TicketFormatterInterface
{
    // 58mm paper, Font A (12 dots/char) ≈ 32 chars per line
    private const WIDTH = 32;

    // Columnas para línea de producto
    private const COL_NAME = 23; // nombre del producto

    private const COL_TOTAL = 9; // total (right-aligned, incluye $)

    public function format(TicketDataInterface $data, Printer $printer): void
    {
        $d = $data->toArray();

        $business = $d['business'];

        // ─── Encabezado ───────────────────────────────────────
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->text($business['name']."\n");
        $printer->setEmphasis(false);
        $printer->feed(1);
        $printer->text($d['fecha_string'].'  '.$d['hora']."\n");
        $printer->feed(1);
        $printer->text($this->line('=')."\n");

        // ─── Info del pedido ──────────────────────────────────
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->setEmphasis(true);
        $printer->text('Mesa : '.$d['nombre_pedido']."\n");
        $printer->setEmphasis(false);
        $prefix = $this->folioPrefix($business['name']);
        $printer->text('Folio: '.$prefix.'-'.str_pad($d['id'], 4, '0', STR_PAD_LEFT)."\n");
        $printer->feed(1);

        // ─── Encabezado de productos ──────────────────────────
        $printer->text($this->line('-')."\n");
        $printer->setEmphasis(true);
        $printer->text($this->productHeader()."\n");
        $printer->setEmphasis(false);
        $printer->text($this->line('-')."\n");

        // ─── Productos ────────────────────────────────────────
        foreach ($d['products'] as $item) {
            $printer->text($this->productLine($item)."\n");
        }

        // ─── Totales ──────────────────────────────────────────
        $printer->text($this->line('=')."\n");
        $printer->setJustification(Printer::JUSTIFY_LEFT);

        $printer->text($this->totalRow('Subtotal:', '$'.number_format($d['subtotal'], 2))."\n");

        if ($d['descuento'] > 0) {
            $printer->text($this->totalRow(
                'Desc. '.$d['descuento'].'%:',
                '-$'.number_format($d['subtotal'] * $d['descuento'] / 100, 2)
            )."\n");
        }

        $printer->setEmphasis(true);
        $printer->text($this->totalRow('TOTAL:', '$'.number_format($d['total'], 2))."\n");
        $printer->setEmphasis(false);

        if (! empty($d['costo_domicilio']) && $d['costo_domicilio'] > 0) {
            $printer->text($this->totalRow('Domicilio:', '-$'.number_format($d['costo_domicilio'], 2))."\n");
            $neto = $d['total'] - $d['costo_domicilio'];
            $printer->setEmphasis(true);
            $printer->text($this->totalRow('INGRESO NETO:', '$'.number_format($neto, 2))."\n");
            $printer->setEmphasis(false);
        }

        $propina = round($d['total'] * 0.10, 2);
        $printer->feed(1);
        $printer->text($this->totalRow('Propina 10%:', '$'.number_format($propina, 2))."\n");

        // ─── Pie del ticket ───────────────────────────────────
        $printer->feed(1);
        $printer->text($this->line('=')."\n");
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $footer = $business['ticket_footer'] ?: 'Gracias por su visita!';
        $printer->text($footer."\n");
        $printer->setEmphasis(false);
        $printer->feed(1);

        if ($business['phone']) {
            $printer->text('Tel: '.$business['phone']."\n");
        }
        if ($business['address']) {
            $printer->text($business['address']."\n");
        }
        if ($business['facebook']) {
            $printer->text('fb: '.$business['facebook']."\n");
        }
        if ($business['instagram']) {
            $printer->text('ig: '.$business['instagram']."\n");
        }
        if ($business['website']) {
            $printer->text($business['website']."\n");
        }

        $printer->text($this->line('=')."\n");
        $printer->feed(4);
    }

    // ─── Helpers ──────────────────────────────────────────────

    private function line(string $char): string
    {
        return str_repeat($char, self::WIDTH);
    }

    /**
     * Encabezado de columnas (una sola línea, 32 chars):
     * "PRODUCTO               TOTAL   "
     */
    private function productHeader(): string
    {
        return str_pad('PRODUCTO', self::COL_NAME)
            .str_pad('TOTAL', self::COL_TOTAL, ' ', STR_PAD_LEFT);
    }

    /**
     * Línea de producto en dos líneas:
     * "Pecho de res             $70.00"  ← nombre + total (32 chars)
     * "  0.350 kg x $200.00"             ← cantidad (con decimales si es peso) x precio
     */
    private function productLine(array $item): string
    {
        $name = mb_substr($item['nombre'], 0, self::COL_NAME);
        $total = '$'.number_format($item['total'], 2);

        $line1 = str_pad($name, self::COL_NAME)
            .str_pad($total, self::COL_TOTAL, ' ', STR_PAD_LEFT);

        $unidad = $item['unidad_medida'] ?? 'unidad';
        $esPeso = in_array($unidad, ['kg', 'gr']);
        $cantidadStr = $esPeso
            ? number_format($item['cantidad'], 3).' '.$unidad
            : (int) $item['cantidad'];

        $line2 = '  '.$cantidadStr.' x $'.number_format($item['precio'], 2);

        $lines = $line1."\n".$line2;

        if ($item['es_extra']) {
            $lines .= "\n  [Extra]";
        }

        return $lines;
    }

    /**
     * Fila de total: label a la izquierda, valor a la derecha (32 chars total).
     */
    private function totalRow(string $label, string $value): string
    {
        $valueLen = strlen($value);
        $labelLen = self::WIDTH - $valueLen;

        return str_pad($label, $labelLen).$value;
    }

    /**
     * Genera el prefijo del folio tomando la primera letra de cada palabra
     * del nombre del negocio en mayúsculas. Ej: "Pollos Sebastián" → "PS".
     */
    private function folioPrefix(string $businessName): string
    {
        $words = preg_split('/\s+/', trim($businessName));
        $prefix = '';
        foreach ($words as $word) {
            $first = mb_substr($word, 0, 1);
            if ($first !== '') {
                $prefix .= mb_strtoupper($first);
            }
        }

        return $prefix ?: 'POS';
    }
}
