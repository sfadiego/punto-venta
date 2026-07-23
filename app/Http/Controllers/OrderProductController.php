<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatusEnum;
use App\Events\OrdersUpdated;
use App\Http\Requests\OrderProductStoreRequest;
use App\Http\Requests\OrderProductUpdateRequest;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;

class OrderProductController extends Controller
{
    /**
     * index
     */
    public function index(OrderModel $order): JsonResponse
    {
        return Response::success(
            OrderProductModel::with('product')
                ->where('pedido_id', $order->id)
                ->get()
        );
    }

    /**
     * show
     */
    public function show(OrderModel $order, string $productId): JsonResponse
    {
        return Response::success(
            OrderProductModel::with('product')->where('pedido_id', $order->id)
                ->where('producto_id', $productId)
                ->get()
        );
    }

    /**
     * store — adds a product (or extra) to the order using incremental total update.
     * Avoids a full SUM recalculation by computing only the delta for the added item.
     */
    public function store(string $orderId, OrderProductStoreRequest $params): JsonResponse
    {
        $order = OrderModel::find($orderId);
        if ($error = $this->assertOrderEditable($order)) {
            return $error;
        }

        $orderDiscount = $order->descuento ?? 0;
        $itemDescuento = $params->descuento ?? 0;

        OrderModel::lockForUpdate()->find($orderId);

        if ($params->nombre_extra) {
            $data = OrderProductModel::create([
                OrderProductModel::PEDIDO_ID => $orderId,
                OrderProductModel::NOMBRE_EXTRA => $params->nombre_extra,
                OrderProductModel::CANTIDAD => $params->cantidad,
                OrderProductModel::PRECIO => $params->precio,
                OrderProductModel::DESCUENTO => $itemDescuento,
            ]);
        } else {
            $data = OrderProductModel::create([
                OrderProductModel::PRODUCTO_ID => $params->producto_id,
                OrderProductModel::PEDIDO_ID => $orderId,
                OrderProductModel::CANTIDAD => $params->cantidad,
                OrderProductModel::PRECIO => $params->precio,
                OrderProductModel::DESCUENTO => $itemDescuento,
                OrderProductModel::IS_READY => false,
            ]);
        }

        $delta = round($params->precio * $params->cantidad * (1 - $itemDescuento / 100), 2);
        $deltaTotal = round($delta * (1 - $orderDiscount / 100), 2);

        DB::table('order')->where('id', $orderId)->update([
            'subtotal' => DB::raw("COALESCE(subtotal, 0) + {$delta}"),
            'total' => DB::raw("COALESCE(total, 0) + {$deltaTotal}"),
        ]);

        $this->resetStatusIfReady($order->fresh());

        return Response::success($data);
    }

    /**
     * update — changes quantity or discount for a product in the order.
     * Uses the delta between old and new line subtotal to avoid a full SUM recalculation.
     */
    public function update(string $orderId, string $productId, OrderProductUpdateRequest $params): JsonResponse
    {
        $orderProduct = OrderProductModel::where('pedido_id', $orderId)
            ->where('id', $productId)
            ->first();

        if (! $orderProduct) {
            return Response::error('La orden no contiene este producto');
        }

        $order = OrderModel::find($orderId);
        if ($error = $this->assertOrderEditable($order)) {
            return $error;
        }
        $orderDiscount = $order->descuento ?? 0;

        $oldLineSubtotal = round($orderProduct->precio * $orderProduct->cantidad * (1 - $orderProduct->descuento / 100), 2);

        $data = [];
        if (isset($params->cantidad)) {
            $data[OrderProductModel::CANTIDAD] = $params->cantidad;
        }
        if (isset($params->descuento)) {
            $data[OrderProductModel::DESCUENTO] = $params->descuento;
        }
        if (isset($params->precio)) {
            $data[OrderProductModel::PRECIO] = $params->precio;
        }

        OrderModel::lockForUpdate()->find($orderId);

        $orderProduct->update($data);
        $orderProduct->refresh();

        $newLineSubtotal = round($orderProduct->precio * $orderProduct->cantidad * (1 - $orderProduct->descuento / 100), 2);
        $deltaSubtotal = $newLineSubtotal - $oldLineSubtotal;
        $deltaTotal = round($deltaSubtotal * (1 - $orderDiscount / 100), 2);

        DB::table('order')->where('id', $orderId)->update([
            'subtotal' => DB::raw("COALESCE(subtotal, 0) + {$deltaSubtotal}"),
            'total' => DB::raw("COALESCE(total, 0) + {$deltaTotal}"),
        ]);

        $this->resetStatusIfReady($order->fresh());

        return Response::success($orderProduct->refresh());
    }

    /**
     * toggleReady — marks/unmarks an order_product as ready to serve by order_product.id
     */
    public function toggleReady(int $orderId, int $item): JsonResponse
    {
        $orderProduct = OrderProductModel::where('pedido_id', $orderId)
            ->where('id', $item)
            ->first();

        if (! $orderProduct) {
            return Response::error('elemento no encontrado');
        }

        $orderProduct->update([
            OrderProductModel::IS_READY => ! $orderProduct->is_ready,
        ]);

        try {
            OrdersUpdated::dispatch('product_updated', (int) $orderId);
        } catch (\Throwable) {
        }

        return Response::success($orderProduct->refresh());
    }

    /**
     * updateNote — updates observacion by order_product.id (works for products and extras)
     */
    public function updateNote(int $orderId, int $item, Request $request): JsonResponse
    {
        $orderProduct = OrderProductModel::where('pedido_id', $orderId)
            ->where('id', $item)
            ->first();

        if (! $orderProduct) {
            return Response::error('elemento no encontrado');
        }

        $orderProduct->update([
            OrderProductModel::OBSERVACION => $request->input('observacion') ?: null,
        ]);

        $order = OrderModel::find($orderId);
        $this->resetStatusIfReady($order);

        return Response::success($orderProduct->refresh());
    }

    /**
     * deleteExtra — deletes any order_product record by its own id
     */
    public function deleteExtra(int $orderId, int $extra): JsonResponse
    {
        $item = OrderProductModel::where('pedido_id', $orderId)
            ->where('id', $extra)
            ->first();

        if (! $item) {
            return Response::error('elemento no encontrado');
        }

        $order = OrderModel::lockForUpdate()->find($orderId);
        if ($error = $this->assertOrderEditable($order)) {
            return $error;
        }
        $orderDiscount = $order->descuento ?? 0;
        $lineSubtotal = round($item->precio * $item->cantidad * (1 - $item->descuento / 100), 2);
        $lineTotal = round($lineSubtotal * (1 - $orderDiscount / 100), 2);

        $item->delete();

        DB::table('order')->where('id', $orderId)->update([
            'subtotal' => max(0, round(($order->subtotal ?? 0) - $lineSubtotal, 2)),
            'total' => max(0, round(($order->total ?? 0) - $lineTotal, 2)),
        ]);

        $this->restoreServedIfAllReady($order->fresh());

        return Response::success('elemento borrado de la orden');
    }

    /**
     * delete — removes a regular product from the order by producto_id
     */
    public function delete(int $orderId, int $product): JsonResponse
    {
        $delete = OrderProductModel::where('pedido_id', $orderId)
            ->where('producto_id', $product)
            ->first();

        if (! $delete) {
            Log::error('producto no encontrado', [$product]);

            return Response::error('producto no encontrado');
        }

        $order = OrderModel::lockForUpdate()->find($orderId);
        if ($error = $this->assertOrderEditable($order)) {
            return $error;
        }
        $orderDiscount = $order->descuento ?? 0;
        $lineSubtotal = round($delete->precio * $delete->cantidad * (1 - $delete->descuento / 100), 2);
        $lineTotal = round($lineSubtotal * (1 - $orderDiscount / 100), 2);

        $delete->delete();

        DB::table('order')->where('id', $orderId)->update([
            'subtotal' => max(0, round(($order->subtotal ?? 0) - $lineSubtotal, 2)),
            'total' => max(0, round(($order->total ?? 0) - $lineTotal, 2)),
        ]);

        $this->restoreServedIfAllReady($order->fresh());

        return Response::success('elemento borrado de la orden');
    }

    /**
     * assertOrderEditable — solo InProcess/Served aceptan modificaciones de productos.
     * Bloquea agregar/editar/borrar productos en órdenes ya cerradas, aunque el
     * cliente envíe la petición (ej. UI desincronizada por caché stale en red lenta).
     */
    private function assertOrderEditable(?OrderModel $order): ?JsonResponse
    {
        if (! $order) {
            return Response::error('no existe la orden');
        }

        $editableStatuses = [OrderStatusEnum::IN_PROCESS->value, OrderStatusEnum::SERVED->value];
        if (! in_array($order->estatus_pedido_id, $editableStatuses, true)) {
            return Response::error('La orden ya fue cerrada y no se puede modificar');
        }

        return null;
    }

    private function resetStatusIfReady(OrderModel $order): void
    {
        if ($order->estatus_pedido_id === OrderStatusEnum::SERVED->value) {
            $order->update(['estatus_pedido_id' => OrderStatusEnum::IN_PROCESS->value]);
            try {
                OrdersUpdated::dispatch('updated', $order->id);
            } catch (\Throwable) {
            }
        }
    }

    /**
     * After a product is removed, if the order is still InProcess and every
     * remaining product is ready, auto-promote it back to Served.
     */
    private function restoreServedIfAllReady(OrderModel $order): void
    {
        if ($order->estatus_pedido_id !== OrderStatusEnum::IN_PROCESS->value) {
            return;
        }

        $remaining = OrderProductModel::where('pedido_id', $order->id)->count();
        if ($remaining === 0) {
            return;
        }

        $hasUnready = OrderProductModel::where('pedido_id', $order->id)
            ->where('is_ready', false)
            ->exists();

        if (! $hasUnready) {
            $order->update(['estatus_pedido_id' => OrderStatusEnum::SERVED->value]);
            try {
                OrdersUpdated::dispatch('restored_served', $order->id);
            } catch (\Throwable) {
            }
        }
    }
}
