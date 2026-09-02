<?php

namespace App\Services;

use App\Enums\OrderStatusEnum;
use App\Events\OrdersUpdated;
use App\Http\Requests\OrderProductStoreRequest;
use App\Http\Requests\OrderProductUpdateRequest;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use Illuminate\Support\Facades\DB;

/**
 * Mutaciones de productos/extras dentro de una orden en proceso: agregar, actualizar,
 * marcar listo, borrar y vaciar el carrito. El controller (OrderProductController) se
 * limita a validar que la orden exista/sea editable y a delegar aquí — este service
 * asume que esa validación ya pasó.
 */
class OrderProductService
{
    /**
     * store — el stock no se toca aquí, se descuenta recién al cerrar la orden
     * (ver OrderController::update).
     */
    public function addProduct(OrderModel $order, OrderProductStoreRequest $params): OrderProductModel
    {
        $orderDiscount = $order->descuento ?? 0;
        $itemDescuento = $params->descuento ?? 0;

        OrderModel::lockForUpdate()->find($order->id);

        if ($params->nombre_extra) {
            $precio = (float) $params->precio;
            $orderProduct = OrderProductModel::create([
                OrderProductModel::PEDIDO_ID => $order->id,
                OrderProductModel::NOMBRE_EXTRA => $params->nombre_extra,
                OrderProductModel::CANTIDAD => $params->cantidad,
                OrderProductModel::PRECIO => $precio,
                OrderProductModel::DESCUENTO => $itemDescuento,
            ]);
        } else {
            $precio = $this->resolveCatalogPrice($params->producto_id, $params->variant_id ?? null);
            $orderProduct = OrderProductModel::create([
                OrderProductModel::PRODUCTO_ID => $params->producto_id,
                OrderProductModel::VARIANT_ID => $params->variant_id ?? null,
                OrderProductModel::PEDIDO_ID => $order->id,
                OrderProductModel::CANTIDAD => $params->cantidad,
                OrderProductModel::PRECIO => $precio,
                OrderProductModel::DESCUENTO => $itemDescuento,
                OrderProductModel::IS_READY => false,
            ]);
        }

        $deltaSubtotal = $this->lineSubtotal($precio, $params->cantidad, $itemDescuento);
        $this->applyOrderDeltaIncrement($order->id, $deltaSubtotal, $orderDiscount);

        $this->resetStatusIfReady($order->fresh());
        OrdersUpdated::dispatchAfterCommit('product_updated', (int) $order->id);

        return $orderProduct;
    }

    /**
     * update — usa el delta entre el subtotal de línea viejo y el nuevo para evitar un
     * recálculo completo por SUM.
     */
    public function updateProduct(OrderModel $order, OrderProductModel $orderProduct, OrderProductUpdateRequest $params): OrderProductModel
    {
        $orderDiscount = $order->descuento ?? 0;
        $oldLineSubtotal = $this->lineSubtotal($orderProduct->precio, $orderProduct->cantidad, $orderProduct->descuento);

        $data = [];
        if (isset($params->cantidad)) {
            $data[OrderProductModel::CANTIDAD] = $params->cantidad;
        }
        if (isset($params->descuento)) {
            $data[OrderProductModel::DESCUENTO] = $params->descuento;
        }
        if (isset($params->variant_id)) {
            $data[OrderProductModel::VARIANT_ID] = $params->variant_id;
            $data[OrderProductModel::PRECIO] = ProductVariantModel::findOrFail($params->variant_id)->precio;
        } elseif ($orderProduct->nombre_extra && isset($params->precio)) {
            $data[OrderProductModel::PRECIO] = $params->precio;
        }

        OrderModel::lockForUpdate()->find($order->id);

        $orderProduct->update($data);
        $orderProduct->refresh();

        $newLineSubtotal = $this->lineSubtotal($orderProduct->precio, $orderProduct->cantidad, $orderProduct->descuento);
        $deltaSubtotal = $newLineSubtotal - $oldLineSubtotal;
        $this->applyOrderDeltaIncrement($order->id, $deltaSubtotal, $orderDiscount);

        $this->resetStatusIfReady($order->fresh());
        OrdersUpdated::dispatchAfterCommit('product_updated', (int) $order->id);

        return $orderProduct->refresh();
    }

    /**
     * toggleReady — decide (bajo el lock de $order, tomado por el controller) si este
     * cambio completa o rompe la condición de "todos listos" y promueve/revierte el
     * estatus de la orden en consecuencia.
     */
    public function toggleReady(OrderModel $order, OrderProductModel $orderProduct): OrderProductModel
    {
        $orderProduct->update([
            OrderProductModel::IS_READY => ! $orderProduct->is_ready,
        ]);

        if ($orderProduct->is_ready) {
            $this->restoreServedIfAllReady($order);
        } else {
            $this->resetStatusIfReady($order);
        }

        OrdersUpdated::dispatchAfterCommit('product_updated', (int) $order->id);

        return $orderProduct->refresh();
    }

    /**
     * removeItem — borra una línea (producto o extra) de la orden y ajusta subtotal/total.
     * Usado tanto para borrar por producto_id como por el id propio del renglón (extra).
     */
    public function removeItem(OrderModel $order, OrderProductModel $item): void
    {
        $orderDiscount = $order->descuento ?? 0;
        $lineSubtotal = $this->lineSubtotal($item->precio, $item->cantidad, $item->descuento);

        $item->delete();

        $this->applyOrderDeltaDecrement($order, $lineSubtotal, $orderDiscount);

        $this->restoreServedIfAllReady($order->fresh());
        OrdersUpdated::dispatchAfterCommit('product_updated', (int) $order->id);
    }

    /**
     * clearCart — borra todos los productos/extras de la orden en un solo paso.
     */
    public function clearCart(OrderModel $order): void
    {
        OrderProductModel::where('pedido_id', $order->id)->delete();

        DB::table('order')->where('id', $order->id)->update([
            'subtotal' => 0,
            'total' => 0,
        ]);

        OrdersUpdated::dispatchAfterCommit('product_updated', (int) $order->id);
    }

    public function resetStatusIfReady(OrderModel $order): void
    {
        if ($order->estatus_pedido_id === OrderStatusEnum::SERVED->value) {
            $order->update(['estatus_pedido_id' => OrderStatusEnum::IN_PROCESS->value]);
            OrdersUpdated::dispatchAfterCommit('updated', $order->id);
        }
    }

    /**
     * Tras borrar un producto, si la orden sigue InProcess y todos los restantes están
     * listos, la promueve de vuelta a Served automáticamente.
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
            OrdersUpdated::dispatchAfterCommit('restored_served', $order->id);
        }
    }

    /**
     * resolveCatalogPrice — el precio de un producto de catálogo nunca se toma del
     * cliente: se resuelve aquí desde la variante seleccionada, o desde el precio
     * base del producto si no tiene variante. Cierra el hueco de que el cliente
     * pudiera mandar un precio arbitrario en el payload.
     */
    private function resolveCatalogPrice(int $productId, ?int $variantId): float
    {
        if ($variantId) {
            return (float) ProductVariantModel::findOrFail($variantId)->precio;
        }

        return (float) ProductModel::findOrFail($productId)->precio;
    }

    private function lineSubtotal(float $precio, float $cantidad, float $descuento): float
    {
        return round($precio * $cantidad * (1 - $descuento / 100), 2);
    }

    /**
     * Incrementa subtotal/total de forma atómica (COALESCE + delta) — usado cuando no se
     * necesita leer el valor actual primero (agregar/actualizar una línea).
     */
    private function applyOrderDeltaIncrement(int $orderId, float $deltaSubtotal, float $orderDiscount): void
    {
        $deltaTotal = round($deltaSubtotal * (1 - $orderDiscount / 100), 2);

        DB::table('order')->where('id', $orderId)->update([
            'subtotal' => DB::raw("COALESCE(subtotal, 0) + {$deltaSubtotal}"),
            'total' => DB::raw("COALESCE(total, 0) + {$deltaTotal}"),
        ]);
    }

    /**
     * Resta subtotal/total a partir de los valores ya cargados en $order (locked por el
     * controller), sin dejar que bajen de 0 — usado al borrar una línea.
     */
    private function applyOrderDeltaDecrement(OrderModel $order, float $lineSubtotal, float $orderDiscount): void
    {
        $lineTotal = round($lineSubtotal * (1 - $orderDiscount / 100), 2);

        DB::table('order')->where('id', $order->id)->update([
            'subtotal' => max(0, round(($order->subtotal ?? 0) - $lineSubtotal, 2)),
            'total' => max(0, round(($order->total ?? 0) - $lineTotal, 2)),
        ]);
    }
}
