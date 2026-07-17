<?php

namespace App\Http\Controllers\Admin;

use App\Enums\MainOrderStatusEnum;
use App\Http\Controllers\Controller;
use App\Http\Requests\OpenSalesRequest;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Response;

class MainOrderReportController extends Controller
{
    public function show(MainOrderReportModel $system): JsonResponse
    {
        return Response::success($system->load('user'));
    }

    public function getActiveSale(): JsonResponse
    {
        return Response::success(
            (new MainOrderReportModel)->getActiveSale()
        );
    }

    public function openSales(OpenSalesRequest $params): JsonResponse
    {
        if (MainOrderReportModel::validateIfOpenSaleActive()) {
            return Response::error('Existe una session de ventas activa');
        }

        return Response::success(
            MainOrderReportModel::openSales(
                $params->efectivo_caja_inicio,
                $params->user_id,
                $params->observaciones ?: '',
            )
        );
    }

    public function totalCurrentSales(MainOrderReportModel $system): JsonResponse
    {
        $bruto = $system->totalSalesByDay();
        $domicilios = $system->totalDomiciliosByDay();
        $propinas = $system->totalPropinasByDay();

        return Response::success([
            'bruto' => $bruto,
            'domicilios' => $domicilios,
            'neto' => round($bruto - $domicilios, 2),
            'propinas' => $propinas,
            'by_payment_method' => $system->totalByPaymentMethod(),
        ]);
    }

    public function closeSales(MainOrderReportModel $system): JsonResponse
    {
        if ($system->estatus_caja == MainOrderStatusEnum::CLOSED->value) {
            return Response::error('sistema cerrado previamente.');
        }

        if (OrderModel::hasActiveOrders($system)) {
            return Response::error('Debes de finalizar todos las mesas para cerrar sistema.');
        }

        return Response::success($system->closeSales());
    }
}
