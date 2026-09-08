<?php

namespace App\Services;

use App\Enums\StockMovementReasonEnum;
use App\Exceptions\InvalidStockReturnException;
use App\Models\OrderProductModel;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use App\Models\StockMovementModel;

/**
 * Devolución de stock ligada a una línea de orden ya cerrada (módulo de Inventario,
 * exclusivo de negocios retail — ver RetailStockMiddleware). Permite devoluciones
 * parciales repetidas sobre la misma línea, mientras la suma acumulada no exceda la
 * cantidad vendida. No modifica order/order_product ni el total de la venta — el
 * histórico de ventas queda intacto, la devolución solo se refleja en stock_movements.
 */
class OrderReturnService
{
    public function __construct(private readonly StockService $stockService) {}

    /**
     * @throws InvalidStockReturnException
     */
    public function returnProduct(
        OrderProductModel $orderProduct,
        float $quantity,
        ?string $note,
        ?int $createdBy,
    ): ProductModel|ProductVariantModel {
        // Lockea la línea para serializar devoluciones concurrentes sobre el mismo
        // order_product — sin esto, dos requests simultáneas podrían leer el mismo
        // remanente y devolver, juntas, más de lo que realmente se vendió.
        $orderProduct = OrderProductModel::where('id', $orderProduct->id)->lockForUpdate()->first();

        $alreadyReturned = (float) StockMovementModel::where('reference_type', OrderProductModel::class)
            ->where('reference_id', $orderProduct->id)
            ->where(StockMovementModel::REASON, StockMovementReasonEnum::Return)
            ->sum(StockMovementModel::QUANTITY);

        $remaining = (float) $orderProduct->cantidad - $alreadyReturned;

        if ($quantity > $remaining) {
            throw new InvalidStockReturnException(
                "La cantidad a devolver excede lo disponible. Máximo devolvible: {$remaining}."
            );
        }

        return $this->stockService->restore(
            productId: $orderProduct->producto_id,
            quantity: $quantity,
            reason: StockMovementReasonEnum::Return,
            variantId: $orderProduct->variant_id,
            reference: $orderProduct,
            createdBy: $createdBy,
            note: $note,
        );
    }
}
