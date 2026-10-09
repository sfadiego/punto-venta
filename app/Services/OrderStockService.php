<?php

namespace App\Services;

use App\Enums\StockMovementReasonEnum;
use App\Exceptions\InsufficientStockException;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;

/**
 * Descuenta o restituye el stock de todas las líneas de una orden — compartido entre el cierre
 * de venta normal (OrderCloseService) y los apartados (LayawayService), que descuentan al crear
 * y restituyen al cancelar.
 */
class OrderStockService
{
    public function __construct(private readonly StockService $stockService) {}

    /**
     * @throws InsufficientStockException
     */
    public function deductForOrder(OrderModel $order, StockMovementReasonEnum $reason): void
    {
        $this->eachManagedItem($order, function (OrderProductModel $item, ProductModel $product) use ($reason) {
            $this->stockService->deduct(
                productId: $product->id,
                quantity: (float) $item->cantidad,
                reason: $reason,
                variantId: $item->variant_id,
                reference: $item,
                createdBy: auth()->id(),
            );
        });
    }

    public function restoreForOrder(OrderModel $order, StockMovementReasonEnum $reason): void
    {
        $this->eachManagedItem($order, function (OrderProductModel $item, ProductModel $product) use ($reason) {
            $this->stockService->restore(
                productId: $product->id,
                quantity: (float) $item->cantidad,
                reason: $reason,
                variantId: $item->variant_id,
                reference: $item,
                createdBy: auth()->id(),
            );
        });
    }

    /**
     * Recorre las líneas con producto que llevan control de stock. Precarga los productos en un
     * solo whereIn (sin N+1) y recorre ordenado por producto_id — mismo criterio que
     * OrderSaleService::createDirectSale(): bloquear siempre en el mismo orden evita deadlocks
     * entre operaciones concurrentes que comparten productos. Una línea con variante afecta el
     * stock de esa variante, no el del producto base (lo resuelve StockService).
     */
    private function eachManagedItem(OrderModel $order, callable $callback): void
    {
        $items = $order->orderProducts()->whereNotNull('producto_id')->get();
        $products = ProductModel::whereIn('id', $items->pluck('producto_id')->unique())->get()->keyBy('id');

        $items->sortBy('producto_id')->each(function (OrderProductModel $item) use ($products, $callback) {
            $product = $products->get($item->producto_id);
            if ($product && $product->manage_stock) {
                $callback($item, $product);
            }
        });
    }
}
