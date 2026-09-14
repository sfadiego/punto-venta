<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductImportRequest;
use App\Services\ProductImportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProductImportController extends Controller
{
    public function __construct(private readonly ProductImportService $service) {}

    /**
     * preview — parsea y resuelve el CSV sin escribir nada (Fase 1). El frontend usa este
     * reporte para decidir si corregir el archivo o confirmar la importación (commit, Fase 2).
     */
    public function preview(ProductImportRequest $request): JsonResponse
    {
        return Response::success($this->service->preview($request->file('file')));
    }

    /** commit — aplica la importación. El frontend solo debe llamarlo tras una preview() exitosa. */
    public function commit(ProductImportRequest $request): JsonResponse
    {
        return Response::success($this->service->commit($request->file('file'), auth()->id()));
    }

    /** template — CSV de ejemplo con las columnas esperadas, para que el usuario arranque de ahí. */
    public function template(): StreamedResponse
    {
        $rows = $this->service->templateRows();

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, 'plantilla-productos.csv', ['Content-Type' => 'text/csv']);
    }
}
