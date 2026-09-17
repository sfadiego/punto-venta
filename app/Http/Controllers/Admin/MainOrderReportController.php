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
    /** 403 si la caja pertenece a una sucursal a la que el usuario no tiene acceso otorgado. */
    private function assertCanAccessSystem(MainOrderReportModel $system): ?JsonResponse
    {
        if ($system->branch_id !== null && ! auth()->user()->canAccessBranch($system->branch_id)) {
            return Response::unauthorized();
        }

        return null;
    }

    public function show(MainOrderReportModel $system): JsonResponse
    {
        return $this->assertCanAccessSystem($system) ?? Response::success($system->load('user'));
    }

    public function getActiveSale(): JsonResponse
    {
        $branchId = request()->query('branch_id');

        if ($branchId !== null && ! auth()->user()->canAccessBranch((int) $branchId)) {
            return Response::unauthorized();
        }

        return Response::success(
            (new MainOrderReportModel)->getActiveSale($branchId !== null ? (int) $branchId : null)
        );
    }

    public function openSales(OpenSalesRequest $params): JsonResponse
    {
        $branchId = $params->branch_id ?? null;

        if (MainOrderReportModel::validateIfOpenSaleActive($branchId)) {
            return Response::error('Existe una session de ventas activa');
        }

        return Response::success(
            MainOrderReportModel::openSales(
                $params->efectivo_caja_inicio,
                $params->user_id,
                $params->observaciones ?: '',
                $branchId,
            )
        );
    }

    public function totalCurrentSales(MainOrderReportModel $system): JsonResponse
    {
        if ($response = $this->assertCanAccessSystem($system)) {
            return $response;
        }

        $bruto = $system->totalSalesByDay();
        $domicilios = $system->totalDomiciliosByDay();
        $propinas = $system->totalPropinasByDay();
        $gastos = $system->totalExpensesByDay();

        return Response::success([
            'bruto' => $bruto,
            'domicilios' => $domicilios,
            'neto' => round($bruto - $domicilios, 2),
            'propinas' => $propinas,
            'gastos' => $gastos,
            'by_payment_method' => $system->totalByPaymentMethod(),
        ]);
    }

    public function closeSales(MainOrderReportModel $system): JsonResponse
    {
        if ($response = $this->assertCanAccessSystem($system)) {
            return $response;
        }

        if ($system->estatus_caja == MainOrderStatusEnum::CLOSED->value) {
            return Response::error('sistema cerrado previamente.');
        }

        if (OrderModel::hasActiveOrders($system)) {
            return Response::error('Debes finalizar todas las órdenes activas para cerrar la caja.');
        }

        if ($system->totalSalesByDay() == 0) {
            return Response::error('No se puede cerrar la caja sin ventas registradas.');
        }

        return Response::success($system->closeSales());
    }
}
