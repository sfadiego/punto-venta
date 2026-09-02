<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class StatisticsController extends Controller
{
    public function top3BestSeller(Request $request): JsonResponse
    {
        [$start, $end] = $this->monthRange($request);
        $sistemaId = $request->integer('sistema_id') ?: null;

        return Response::success(OrderProductModel::top3BestSeller($start, $end, $sistemaId));
    }

    public function averageTicket(Request $request): JsonResponse
    {
        [$start, $end] = $this->monthRange($request);
        $sistemaId = $request->integer('sistema_id') ?: null;

        return Response::success(OrderModel::averageTicket($start, $end, $sistemaId));
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
