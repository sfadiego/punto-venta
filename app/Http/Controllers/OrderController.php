<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Enums\ActivityTypeEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\StockMovementReasonEnum;
use App\Events\OrdersUpdated;
use App\Exceptions\InsufficientStockException;
use App\Http\Requests\OrderStoreRequest;
use App\Http\Requests\OrderStoreSaleRequest;
use App\Http\Requests\OrderUpdateRequest;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;
use App\Services\OrderCreditService;
use App\Services\OrderSaleService;
use App\Services\OrderService;
use App\Services\SalesReportExportService;
use App\Services\StockService;
use App\Services\TenantActivityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
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
        $this->broadcast('created');

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

    public function update(
        OrderModel $order,
        OrderUpdateRequest $params,
        OrderCreditService $creditService,
        TenantActivityService $activityService,
        StockService $stockService,
    ): JsonResponse {
        $data = $params->toArray();
        $orderDetail = $order->totalAndSubTotalOrder();
        $wasClosed = $order->estatus_pedido_id === OrderStatusEnum::CLOSED->value;
        $becomingClosed = (int) ($data['estatus_pedido_id'] ?? 0) === OrderStatusEnum::CLOSED->value;

        // El stock se descuenta recién cuando la venta se concreta (la orden pasa a Closed),
        // no al ir agregando productos al carrito — así una orden InProcess abandonada o
        // cancelada nunca dejó tocado el stock de nadie. Si algún producto ya no alcanza,
        // el cierre completo falla y la orden se queda como estaba.
        if ($becomingClosed && ! $wasClosed) {
            try {
                $this->deductStockForOrder($order, $stockService);
            } catch (InsufficientStockException $e) {
                return Response::error($e->getMessage());
            }
        }

        $order->update(array_merge($data, [
            'total' => $orderDetail['total'],
            'subtotal' => $orderDetail['subtotal'],
        ]));

        // Una venta directa (QuickSale) ya llega Closed desde su creación — el PUT que
        // fija is_credit/customer_id no vuelve a mandar estatus_pedido_id, así que
        // $becomingClosed por sí solo no detecta este caso. credit_applied_at en el
        // servicio garantiza que esto sea idempotente sin importar cuántas veces se llame.
        $creditService->applyIfClosingAsCredit($order, $wasClosed || $becomingClosed);

        if ($becomingClosed && ! $wasClosed) {
            $activityService->log($order->tenant_id, ActivityTypeEnum::SALE_CLOSED);
        }

        $isServed = (int) ($data['estatus_pedido_id'] ?? 0) === OrderStatusEnum::SERVED->value;
        $this->broadcast($isServed ? 'served' : 'updated', $order->id);

        return Response::success($order->fresh(['paymentMethod:id,name', 'customer:id,name,balance,phone']));
    }

    /**
     * @throws InsufficientStockException
     */
    private function deductStockForOrder(OrderModel $order, StockService $stockService): void
    {
        $order->orderProducts()
            ->whereNotNull('producto_id')
            ->get()
            ->each(function (OrderProductModel $item) use ($stockService) {
                $product = ProductModel::find($item->producto_id);
                // Ver comentario equivalente en OrderSaleService::createDirectSale — una línea
                // con variante descuenta el stock de esa variante, no el del producto base.
                if ($product && $product->manage_stock) {
                    $stockService->deduct(
                        productId: $product->id,
                        quantity: (float) $item->cantidad,
                        reason: StockMovementReasonEnum::Sale,
                        variantId: $item->variant_id,
                        reference: $item,
                    );
                }
            });
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

    public function exportSalesReport(Request $request, SalesReportExportService $exportService): HttpResponse
    {
        $sistemaId = $request->query('sistema_id') ? (int) $request->query('sistema_id') : null;
        $date = $request->query('fecha');
        $week = $request->query('semana');
        $month = $request->query('mes');
        $sellByWeight = (bool) ($request->user()->tenant->tipo_negocio->features()['sell_by_weight'] ?? false);

        $pdf = $exportService->buildPdf($sistemaId, $date, $week, $month, $sellByWeight);
        $filename = 'reporte-ventas-'.now()->format('Y-m-d-His').'.pdf';

        return response($pdf, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    // Se difiere con DB::afterCommit para que el broadcast (llamada HTTP síncrona a Reverb)
    // no se ejecute mientras la fila de la orden sigue bloqueada por lockForUpdate() — de lo
    // contrario, otras requests concurrentes sobre la misma orden (agregar producto, marcar
    // listo, etc.) se encolan detrás del lock además de la latencia del broadcast, pudiendo
    // superar el timeout de axios en el cliente.
    private function broadcast(string $type = 'updated', ?int $orderId = null): void
    {
        DB::afterCommit(function () use ($type, $orderId) {
            try {
                OrdersUpdated::dispatch($type, $orderId);
            } catch (\Throwable) {
                // Reverb unavailable — order operation must not fail
            }
        });
    }
}
