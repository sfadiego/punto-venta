<?php

namespace App\Core\Export;

use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Descarga en streaming de un reporte tabular (encabezados + filas) como CSV. Las filas llegan como
 * iterable (generador/cursor) para no cargar el reporte completo en memoria.
 */
class CsvExport
{
    /**
     * @param  string[]  $headers
     * @param  iterable<int, array<int, string|int|float|null>>  $rows
     */
    public function download(string $basename, array $headers, iterable $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($headers, $rows) {
            $out = fopen('php://output', 'w');
            // BOM UTF-8: sin él Excel abre el archivo con otra codificación y rompe los acentos.
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $headers, ',', '"', '');
            foreach ($rows as $row) {
                fputcsv($out, array_map($this->safeCell(...), $row), ',', '"', '');
            }
            fclose($out);
        }, "{$basename}-".now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Neutraliza la inyección de fórmulas al abrir el CSV en Excel/Sheets: un texto que empieza con
     * =, +, - o @ se ejecutaría como fórmula. El apóstrofo inicial lo fuerza a texto plano.
     */
    private function safeCell(string|int|float|null $value): string|int|float|null
    {
        if (! is_string($value)) {
            return $value;
        }

        $text = trim($value);

        return $text !== '' && str_contains("=+-@\t\r", $text[0]) ? "'".$text : $text;
    }
}
