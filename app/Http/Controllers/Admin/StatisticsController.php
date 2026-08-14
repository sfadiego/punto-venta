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

        return [
            $date->copy()->startOfMonth()->utc(),
            $date->copy()->endOfMonth()->utc(),
        ];
    }
}
