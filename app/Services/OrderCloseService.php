<?php

namespace App\Services;

use App\Enums\ActivityTypeEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\StockMovementReasonEnum;
use App\Events\OrdersUpdated;
use App\Exceptions\InsufficientStockException;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;

/**
 * Orquesta la actualización de una orden (OrderController::update): descuento de stock
 * al cerrar, aplicación de crédito, log de actividad y notificación por socket. Separado
 * de OrderSaleService (venta directa de un solo paso) porque este flujo actualiza una
 * orden InProcess/Served ya existente en vez de crear una nueva.
 */
class OrderCloseService
{
    public function __construct(
        private readonly StockService $stockService,
        private readonly OrderCreditService $creditService,
        private readonly TenantActivityService $activityService,
    ) {}

    /**
     * @throws InsufficientStockException
     */
    public function update(OrderModel $order, array $data): OrderModel
    {
        $orderDetail = $order->totalAndSubTotalOrder();
        $wasClosed = $order->estatus_pedido_id === OrderStatusEnum::CLOSED->value;
        $becomingClosed = (int) ($data['estatus_pedido_id'] ?? 0) === OrderStatusEnum::CLOSED->value;

        // El stock se descuenta recién cuando la venta se concreta (la orden pasa a Closed),
        // no al ir agregando productos al carrito — así una orden InProcess abandonada o
        // cancelada nunca dejó tocado el stock de nadie. Si algún producto ya no alcanza,
        // el cierre completo falla y la orden se queda como estaba.
        if ($becomingClosed && ! $wasClosed) {
            $this->deductStockForOrder($order);
        }

        $order->update(array_merge($data, [
            'total' => $orderDetail['total'],
            'subtotal' => $orderDetail['subtotal'],
        ]));

        // Una venta directa (QuickSale) ya llega Closed desde su creación — el PUT que
        // fija is_credit/customer_id no vuelve a mandar estatus_pedido_id, así que
        // $becomingClosed por sí solo no detecta este caso. credit_applied_at en el
        // servicio garantiza que esto sea idempotente sin importar cuántas veces se llame.
        $this->creditService->applyIfClosingAsCredit($order, $wasClosed || $becomingClosed);

        if ($becomingClosed && ! $wasClosed) {
            $this->activityService->log($order->tenant_id, ActivityTypeEnum::SALE_CLOSED);
        }

        $isServed = (int) ($data['estatus_pedido_id'] ?? 0) === OrderStatusEnum::SERVED->value;
        OrdersUpdated::dispatchAfterCommit($isServed ? 'served' : 'updated', $order->id);

        return $order->fresh(['paymentMethod:id,name', 'customer:id,name,balance,phone']);
    }

    /**
     * @throws InsufficientStockException
     */
    private function deductStockForOrder(OrderModel $order): void
    {
        $order->orderProducts()
            ->whereNotNull('producto_id')
            ->get()
            ->each(function (OrderProductModel $item) {
                $product = ProductModel::find($item->producto_id);
                // Ver comentario equivalente en OrderSaleService::createDirectSale — una línea
                // con variante descuenta el stock de esa variante, no el del producto base.
                if ($product && $product->manage_stock) {
                    $this->stockService->deduct(
                        productId: $product->id,
                        quantity: (float) $item->cantidad,
                        reason: StockMovementReasonEnum::Sale,
                        variantId: $item->variant_id,
                        reference: $item,
                    );
                }
            });
    }
}
