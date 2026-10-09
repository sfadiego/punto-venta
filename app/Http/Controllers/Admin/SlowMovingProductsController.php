<?php

namespace App\Http\Controllers\Admin;

use App\Core\Data\IndexData;
use App\Core\Export\CsvExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\SlowMovingProductsRequest;
use App\Services\SlowMovingExportService;
use App\Services\SlowMovingProductsReport;
use App\Services\SlowMovingProductsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SlowMovingProductsController extends Controller
{
    public function __construct(private readonly SlowMovingProductsReport $report) {}

    public function index(SlowMovingProductsRequest $request, IndexData $data, SlowMovingProductsService $service): JsonResponse
    {
        return $service->run($data);
    }

    public function summary(SlowMovingProductsRequest $request): JsonResponse
    {
        return Response::success($this->report->summary($request->integer('days', SlowMovingProductsReport::DEFAULT_DAYS)));
    }

    /** Descarga el listado completo del filtro activo (días, búsqueda, categoría) como CSV. */
    public function export(SlowMovingProductsRequest $request, SlowMovingExportService $service, CsvExport $export): StreamedResponse
    {
        $categoryId = $request->query('categoria_id');
        $rows = $service->rows(
            $request->integer('days', SlowMovingProductsReport::DEFAULT_DAYS),
            $request->query('search'),
            $categoryId ? (int) $categoryId : null,
        );

        return $export->download('productos-sin-movimiento', $service->headers(), $rows);
    }
}
