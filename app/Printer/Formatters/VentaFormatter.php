<?php

namespace App\Printer\Formatters;

use App\Printer\Dto\TicketDataInterface;
use App\Printer\Interface\TicketFormatterInterface;
use Mike42\Escpos\Printer;

class VentaFormatter implements TicketFormatterInterface
{
    // Caracteres por línea según el ancho de papel, Font A (12 dots/char):
    // 58mm ≈ 32 chars, 80mm ≈ 48 chars.
    private const CHARS_PER_PAPER_WIDTH = [
        '58' => 32,
        '80' => 48,
    ];

    private int $width;

    private int $colName; // nombre del producto

    private int $colTotal; // total (right-aligned, incluye $)

    public function format(TicketDataInterface $data, Printer $printer): void
    {
        $d = $data->toArray();

        $business = $d['business'];

        $this->width = self::charsForPaperWidth($business['paper_width'] ?? '58');
        $this->colTotal = (int) round($this->width * 9 / 32);
        $this->colName = $this->width - $this->colTotal;

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
        $titulo = empty($d['sell_by_weight']) ?  'Mesa: ' : 'Pedido: ' ;
        $printer->text($titulo.' '.$d['nombre_pedido']."\n");
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

        if (! empty($d['is_delivery']) && $d['costo_domicilio'] > 0) {
            $printer->text($this->totalRow('Domicilio:', '-$'.number_format($d['costo_domicilio'], 2))."\n");
        }

        if (empty($d['sell_by_weight'])) {
            $propina = round($d['total'] * 0.10, 2);
            $printer->feed(1);
            $printer->text($this->totalRow('Propina 10%:', '$'.number_format($propina, 2))."\n");
        }

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

    /** Caracteres por línea para un ancho de papel dado (mm, '58' o '80'). */
    public static function charsForPaperWidth(?string $paperWidth): int
    {
        return self::CHARS_PER_PAPER_WIDTH[$paperWidth ?? '58'] ?? 32;
    }

    // ─── Helpers ──────────────────────────────────────────────

    private function line(string $char): string
    {
        return str_repeat($char, $this->width);
    }

    /**
     * Encabezado de columnas (una sola línea, ancho según el papel):
     * "PRODUCTO               TOTAL   "
     */
    private function productHeader(): string
    {
        return str_pad('PRODUCTO', $this->colName)
            .str_pad('TOTAL', $this->colTotal, ' ', STR_PAD_LEFT);
    }

    /**
     * Línea de producto en dos líneas:
     * "Pecho de res             $70.00"  ← nombre + total (ancho según el papel)
     * "  0.350 kg x $200.00"             ← cantidad (con decimales si es peso) x precio
     */
    private function productLine(array $item): string
    {
        $name = mb_substr($item['nombre'], 0, $this->colName);
        $total = '$'.number_format($item['total'], 2);

        $line1 = str_pad($name, $this->colName)
            .str_pad($total, $this->colTotal, ' ', STR_PAD_LEFT);

        $unidad = $item['unidad_medida'] ?? 'unidad';
        $esPeso = in_array($unidad, ['kg', 'gr', 'litro']);
        $cantidadStr = $esPeso
            ? $this->trimTrailingZeros($item['cantidad'], 3).' '.$unidad
            : (int) $item['cantidad'];

        $line2 = '  '.$cantidadStr.' x $'.number_format($item['precio'], 2);

        $lines = $line1."\n".$line2;

        if ($item['descuento'] > 0) {
            $originalTotal = $item['precio'] * $item['cantidad'];
            $saved = round($originalTotal - $item['total'], 2);
            $lines .= "\n  Desc. ".(int) $item['descuento'].'% (-$'.number_format($saved, 2).')';
        }

        if ($item['es_extra']) {
            $lines .= "\n  [Extra]";
        }

        return $lines;
    }

    /**
     * Formatea un número con hasta $decimals decimales, removiendo ceros
     * (y el punto) sobrantes al final. Ej: 0.350 -> "0.35", 1.000 -> "1".
     */
    private function trimTrailingZeros(float $value, int $decimals): string
    {
        return rtrim(rtrim(number_format($value, $decimals, '.', ''), '0'), '.');
    }

    /**
     * Fila de total: label a la izquierda, valor a la derecha (ancho según el papel).
     */
    private function totalRow(string $label, string $value): string
    {
        $valueLen = strlen($value);
        $labelLen = $this->width - $valueLen;

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
