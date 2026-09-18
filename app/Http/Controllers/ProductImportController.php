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

    /**
     * commit — aplica la importación. El frontend solo debe llamarlo tras una preview()
     * exitosa. Para archivos grandes, llama esto varias veces con offset/limit crecientes
     * (chunks) en vez de una sola vez con todo el archivo — ver doc en
     * ProductImportService::commit().
     */
    public function commit(ProductImportRequest $request): JsonResponse
    {
        return Response::success($this->service->commit(
            $request->file('file'),
            auth()->id(),
            // offset=0 es un chunk válido (el primero) — nunca tratarlo como "ausente".
            $request->has('offset') ? $request->integer('offset') : null,
            $request->has('limit') ? $request->integer('limit') : null,
        ));
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
