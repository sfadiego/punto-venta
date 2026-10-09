<?php

namespace App\Http\Controllers\Admin;

use App\Core\Export\CsvExport;
use App\Http\Controllers\Controller;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Services\DebtorsExportService;
use App\Services\TopDebtorsService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StatisticsController extends Controller
{
    public function top3BestSeller(Request $request): JsonResponse
    {
        [$start, $end] = $this->monthRange($request);
        $sistemaId = $request->integer('sistema_id') ?: null;
        $branchId = $request->integer('branch_id') ?: null;

        if ($branchId && ! auth()->user()->canAccessBranch($branchId)) {
            return Response::unauthorized();
        }

        return Response::success(OrderProductModel::top3BestSeller($start, $end, $sistemaId, $branchId));
    }

    /**
     * Clientes con más adeudo — solo retail y venta por peso (los tipos de negocio donde el crédito a
     * clientes es parte del flujo); en cualquier otro tipo de negocio responde 403.
     */
    public function topDebtors(TopDebtorsService $service): JsonResponse
    {
        if (! $this->debtorsReportAvailable()) {
            return Response::unauthorized();
        }

        return Response::success($service->top());
    }

    /** Descarga la cartera completa de clientes con adeudo (CSV). Mismo alcance que topDebtors. */
    public function exportTopDebtors(DebtorsExportService $service, CsvExport $export): JsonResponse|StreamedResponse
    {
        if (! $this->debtorsReportAvailable()) {
            return Response::unauthorized();
        }

        return $export->download('clientes-con-adeudo', $service->headers(), $service->rows());
    }

    private function debtorsReportAvailable(): bool
    {
        $features = auth()->user()->tenant->tipo_negocio->features();

        return $features['is_retail'] || $features['sell_by_weight'];
    }

    public function averageTicket(Request $request): JsonResponse
    {
        [$start, $end] = $this->monthRange($request);
        $sistemaId = $request->integer('sistema_id') ?: null;
        $branchId = $request->integer('branch_id') ?: null;

        if ($branchId && ! auth()->user()->canAccessBranch($branchId)) {
            return Response::unauthorized();
        }

        return Response::success(OrderModel::averageTicket($start, $end, $sistemaId, $branchId));
    }

    /**
     * @return array{0: ?Carbon, 1: ?Carbon}
     */
    private function monthRange(Request $request): array
    {
        if (! $raw = $request->input('date')) {
            return [null, null];
        }

        $tz = config('app.timezone');
        $date = Carbon::parse($raw, $tz);

        // Sin conversión a UTC: created_at se guarda en hora local (ver
        // LoadConfiguration::bootstrap, que fija la timezone por defecto de PHP), así que
        // el rango de comparación debe quedarse en esa misma zona horaria. Convertir a UTC
        // aquí desplazaba la ventana ~6h, excluyendo ventas de las primeras horas del mes.
        return [
            $date->copy()->startOfMonth(),
            $date->copy()->endOfMonth(),
        ];
    }
}
