<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Enums\OrderStatusEnum;
use App\Events\OrdersUpdated;
use App\Http\Requests\OrderStoreRequest;
use App\Http\Requests\OrderStoreSaleRequest;
use App\Http\Requests\OrderUpdateRequest;
use App\Models\OrderModel;
use App\Services\OrderCreditService;
use App\Services\OrderSaleService;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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

        return Response::success($order->load(['orderProducts.product', 'paymentMethod:id,name']));
    }

    public function delete(OrderModel $order): JsonResponse
    {
        $order->orderProducts()->delete();

        return Response::success($order->delete());
    }

    public function update(OrderModel $order, OrderUpdateRequest $params, OrderCreditService $creditService): JsonResponse
    {
        $data = $params->toArray();
        $orderDetail = $order->totalAndSubTotalOrder();

        DB::transaction(function () use ($order, $data, $orderDetail, $creditService) {
            $order->update(array_merge($data, [
                'total' => $orderDetail['total'],
                'subtotal' => $orderDetail['subtotal'],
            ]));

            $becomingClosed = (int) ($data['estatus_pedido_id'] ?? 0) === OrderStatusEnum::CLOSED->value;
            $creditService->applyIfClosingAsCredit($order, $becomingClosed);
        });

        $isServed = (int) ($data['estatus_pedido_id'] ?? 0) === OrderStatusEnum::SERVED->value;
        $this->broadcast($isServed ? 'served' : 'updated', $order->id);

        return Response::success($order->fresh(['paymentMethod:id,name', 'customer:id,name,balance']));
    }

    public function total(OrderModel $order): JsonResponse
    {
        return Response::success($order->totalOrderProducts());
    }

    public function storeSale(OrderStoreSaleRequest $params, OrderSaleService $saleService): JsonResponse
    {
        $order = $saleService->createDirectSale($params->validated());

        return Response::success($order->load('orderProducts'));
    }

    public function salesByCategory(Request $request, OrderSaleService $saleService): JsonResponse
    {
        $sistemaId = $request->query('sistema_id') ? (int) $request->query('sistema_id') : null;
        $date = $request->query('fecha');

        if (! $sistemaId && ! $date) {
            return Response::error('Se requiere sistema_id o fecha.');
        }

        return Response::success($saleService->salesByCategory($sistemaId, $date));
    }

    private function broadcast(string $type = 'updated', ?int $orderId = null): void
    {
        try {
            OrdersUpdated::dispatch($type, $orderId);
        } catch (\Throwable) {
            // Reverb unavailable — order operation must not fail
        }
    }
}
