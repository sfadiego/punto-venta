<?php

namespace App\Http\Controllers;

use App\Core\Data\IndexData;
use App\Enums\OrderStatusEnum;
use App\Http\Requests\OrderStoreRequest;
use App\Http\Requests\OrderUpdateRequest;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
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
        return Response::success(OrderModel::create($params->toArray()));
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

        return Response::success($order->load('orderProducts.product'));
    }

    public function delete(OrderModel $order): JsonResponse
    {
        $order->orderProducts()->delete();

        return Response::success($order->delete());
    }

    public function update(OrderModel $order, OrderUpdateRequest $params): JsonResponse
    {
        $orderDetail = $order->totalAndSubTotalOrder();
        $order->update(
            array_merge($params->toArray(), [
                'total' => $orderDetail['total'],
                'subtotal' => $orderDetail['subtotal'],
            ])
        );

        return Response::success($order);
    }

    public function total(OrderModel $order): JsonResponse
    {
        return Response::success($order->totalOrderProducts());
    }

    public function storeSale(Request $request): JsonResponse
    {
        $data = $request->validate([
            'sistema_id' => 'required|numeric|exists:main_order_report,id',
            'nombre_pedido' => 'required|string',
            'costo_domicilio' => 'sometimes|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.producto_id' => 'required|numeric|exists:product,id',
            'items.*.cantidad' => 'required|numeric|min:0.001',
            'items.*.precio' => 'required|numeric|min:0',
        ]);

        $order = DB::transaction(function () use ($data) {
            $subtotal = collect($data['items'])->sum(fn ($i) => $i['precio'] * $i['cantidad']);

            $order = OrderModel::create([
                OrderModel::SISTEMA_ID => $data['sistema_id'],
                OrderModel::NOMBRE_PEDIDO => $data['nombre_pedido'],
                OrderModel::SUBTOTAL => $subtotal,
                OrderModel::TOTAL => $subtotal,
                OrderModel::COSTO_DOMICILIO => $data['costo_domicilio'] ?? 0,
                OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            ]);

            foreach ($data['items'] as $item) {
                OrderProductModel::create([
                    OrderProductModel::PEDIDO_ID => $order->id,
                    OrderProductModel::PRODUCTO_ID => $item['producto_id'],
                    OrderProductModel::CANTIDAD => $item['cantidad'],
                    OrderProductModel::PRECIO => $item['precio'],
                ]);
            }

            $order->update([
                OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            ]);

            return $order;
        });

        return Response::success($order->load('orderProducts'));
    }

    public function salesByCategory(Request $request): JsonResponse
    {
        $sistemaId = (int) $request->query('sistema_id', 0);

        $results = OrderProductModel::query()
            ->join('order', 'order.id', '=', 'order_product.pedido_id')
            ->join('product', 'product.id', '=', 'order_product.producto_id')
            ->join('categories', 'categories.id', '=', 'product.categoria_id')
            ->where('order.sistema_id', $sistemaId)
            ->where('order.estatus_pedido_id', OrderStatusEnum::CLOSED->value)
            ->groupBy('categories.id', 'categories.nombre')
            ->selectRaw('categories.id, categories.nombre, SUM(order_product.cantidad) as total_cantidad, SUM(order_product.precio * order_product.cantidad) as total_revenue')
            ->orderByDesc('total_revenue')
            ->get();

        return Response::success($results);
    }
}
