<?php

namespace App\Http\Controllers;

use App\Services\ProductExportService;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductExportController extends Controller
{
    public function __construct(private readonly ProductExportService $service) {}

    /** export — descarga el catálogo completo (activos e inactivos) como CSV informativo. */
    public function export(): StreamedResponse
    {
        $filename = 'catalogo-productos-'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () {
            $out = fopen('php://output', 'w');
            // BOM UTF-8: sin él Excel abre el archivo con otra codificación y rompe los acentos.
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, $this->service->headers());
            foreach ($this->service->rows() as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
