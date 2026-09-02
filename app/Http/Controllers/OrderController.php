<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Events\OrdersUpdated;
use App\Exceptions\InsufficientStockException;
use App\Http\Requests\OrderStoreRequest;
use App\Http\Requests\OrderStoreSaleRequest;
use App\Http\Requests\OrderUpdateRequest;
use App\Models\OrderModel;
use App\Services\OrderCloseService;
use App\Services\OrderSaleService;
use App\Services\OrderService;
use App\Services\SalesReportExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Response;

class OrderController extends Controller
{
    public function index(IndexData $data, OrderService $service): JsonResponse
    {
        return $service->run($data);
    }

    public function store(OrderStoreRequest $params): JsonResponse
    {
        $order = OrderModel::create($params->toArray());
        OrdersUpdated::dispatchAfterCommit('created');

        return Response::success($order);
    }

    public function show(OrderModel $order): JsonResponse
    {
        $orderDetail = $order->totalAndSubTotalOrder();
        if ($orderDetail['total'] !== $order->total) {
            $order->update([
                'total' => $orderDetail['total'],
                'subtotal' => $orderDetail['subtotal'],
            ]);
        }

        return Response::success($order->load(['orderProducts.product', 'orderProducts.variant', 'paymentMethod:id,name', 'customer:id,name,phone']));
    }

    public function delete(OrderModel $order): JsonResponse
    {
        // El stock solo se descuenta al cerrar la orden (ver update()) — una orden InProcess/
        // Served nunca lo tocó, así que cancelarla aquí no necesita restaurar nada.
        $order->orderProducts()->delete();

        return Response::success($order->delete());
    }

    public function update(OrderModel $order, OrderUpdateRequest $params, OrderCloseService $closeService): JsonResponse
    {
        try {
            $updated = $closeService->update($order, $params->toArray());
        } catch (InsufficientStockException $e) {
            return Response::error($e->getMessage());
        }

        return Response::success($updated);
    }

    public function total(OrderModel $order): JsonResponse
    {
        return Response::success($order->totalOrderProducts());
    }

    public function storeSale(OrderStoreSaleRequest $params, OrderSaleService $saleService): JsonResponse
    {
        try {
            $order = $saleService->createDirectSale($params->validated());
        } catch (InsufficientStockException $e) {
            return Response::error($e->getMessage());
        }

        return Response::success($order->load('orderProducts'));
    }

    public function salesByCategory(Request $request, OrderSaleService $saleService): JsonResponse
    {
        $sistemaId = $request->query('sistema_id') ? (int) $request->query('sistema_id') : null;
        $date = $request->query('fecha');
        $week = $request->query('semana');
        $month = $request->query('mes');

        if (! $sistemaId && ! $date && ! $week && ! $month) {
            return Response::error('Se requiere sistema_id, fecha, semana o mes.');
        }

        return Response::success($saleService->salesByCategory($sistemaId, $date, $month, $week));
    }

    public function creditCustomers(Request $request, OrderSaleService $saleService): JsonResponse
    {
        $sistemaId = $request->query('sistema_id');

        if (! $sistemaId) {
            return Response::error('Se requiere sistema_id.');
        }

        return Response::success($saleService->creditCustomersBySession((int) $sistemaId));
    }

    public function exportSalesReport(Request $request, SalesReportExportService $exportService): JsonResponse|HttpResponse
    {
        $sistemaId = $request->query('sistema_id') ? (int) $request->query('sistema_id') : null;
        $date = $request->query('fecha');
        $week = $request->query('semana');
        $month = $request->query('mes');

        if (! $sistemaId && ! $date && ! $week && ! $month) {
            return Response::error('Se requiere sistema_id, fecha, semana o mes.');
        }

        $sellByWeight = (bool) ($request->user()->tenant->tipo_negocio->features()['sell_by_weight'] ?? false);

        $pdf = $exportService->buildPdf($sistemaId, $date, $week, $month, $sellByWeight);
        $filename = 'reporte-ventas-'.now()->format('Y-m-d-His').'.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
