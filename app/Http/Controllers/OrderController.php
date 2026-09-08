<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Enums\OrderStatusEnum;
use App\Enums\StockMovementReasonEnum;
use App\Events\OrdersUpdated;
use App\Exceptions\InsufficientStockException;
use App\Http\Requests\OrderStoreRequest;
use App\Http\Requests\OrderStoreSaleRequest;
use App\Http\Requests\OrderUpdateRequest;
use App\Models\OrderModel;
use App\Models\StockMovementModel;
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

    /**
     * listClosed — versión ligera sin paginar, para el combobox de devolución de stock
     * (módulo de Inventario). A diferencia de index(), nunca ignora el filtro de estatus:
     * solo busca entre órdenes ya cerradas, que es la única a la que se le puede devolver.
     */
    public function listClosed(Request $request): JsonResponse
    {
        $search = $request->query('search');

        $query = OrderModel::where('estatus_pedido_id', OrderStatusEnum::CLOSED->value)
            ->with('customer:id,name')
            ->orderByDesc('created_at')
            ->limit(20);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre_pedido', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        return Response::success(
            $query->get(['id', 'nombre_pedido', 'total', 'created_at', 'customer_id'])
        );
    }

    public function store(OrderStoreRequest $params): JsonResponse
    {
        $order = OrderModel::create($params->except('silent'));

        if (! $params->boolean('silent')) {
            OrdersUpdated::dispatchAfterCommit('created');
        }

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

        return Response::success($order->load([
            'orderProducts.product',
            'orderProducts.variant',
            // Devoluciones de cada línea (módulo de Inventario) — se cargan siempre, el
            // costo es despreciable cuando no hay ninguna (constraint vacía). El frontend
            // decide si mostrar la sección según si viene algo o no.
            'orderProducts.stockMovements' => fn ($q) => $q
                ->where(StockMovementModel::REASON, StockMovementReasonEnum::Return)
                ->with('createdBy:id,nombre')
                ->latest(),
            'paymentMethod:id,name',
            'customer:id,name,phone',
        ]));
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
