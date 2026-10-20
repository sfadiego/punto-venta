<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProductBarcodeCatalogRequest;
use App\Services\ProductBarcodeCatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Response;

class ProductBarcodeCatalogController extends Controller
{
    public function __construct(private readonly ProductBarcodeCatalogService $service) {}

    /**
     * download — descarga el catálogo completo (activos e inactivos) en PDF: con el código de barras
     * de cada producto o, con include_barcode=0, como una lista simple con el código como texto.
     */
    public function download(ProductBarcodeCatalogRequest $request): JsonResponse|HttpResponse
    {
        if ($this->service->exceedsRowLimit()) {
            return Response::error('El catálogo tiene demasiados productos para exportar en un solo PDF.');
        }

        $includeBarcode = $request->includeBarcode();
        $filename = ($includeBarcode ? 'catalogo-codigos-de-barras-' : 'catalogo-productos-').now()->format('Y-m-d-His').'.pdf';

        return response($this->service->buildPdf($includeBarcode), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
