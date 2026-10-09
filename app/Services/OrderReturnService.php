<?php

namespace App\Services;

use App\Enums\ReturnReasonEnum;
use App\Enums\StockMovementReasonEnum;
use App\Events\OrdersUpdated;
use App\Exceptions\InvalidStockReturnException;
use App\Models\CustomerModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\OrderReturnItemModel;
use App\Models\OrderReturnModel;
use App\Models\StockMovementModel;
use Illuminate\Support\Collection;

/**
 * Devolución de una orden ya cerrada (módulo de Inventario, exclusivo de negocios retail — ver
 * RetailStockMiddleware). Una devolución agrupa varias líneas de la misma orden bajo un motivo y
 * se aplica completa o no se aplica: si una línea excede lo devolvible no se devuelve ninguna.
 * Permite devoluciones parciales repetidas sobre una línea mientras la suma acumulada no exceda
 * la cantidad vendida. No modifica order/order_product ni el total de la venta — el histórico de
 * ventas queda intacto.
 *
 * Además de devolver el stock, la devolución puede reembolsar el dinero: lo que el cliente pagó por las
 * piezas, por el método elegido y desde la caja abierta de la sucursal (el cuadre de caja de esa sesión
 * lo descuenta). Una venta a crédito baja primero el saldo del cliente y solo el resto sale por método.
 *
 * El motivo decide el destino de la pieza: una defectuosa no vuelve al stock vendible, así que
 * además de la entrada por devolución se registra una salida por merma (el stock queda igual y el
 * kardex muestra ambos movimientos).
 */
class OrderReturnService
{
    public function __construct(
        private readonly StockService $stockService,
        private readonly OrderReturnRefundCalc $refundCalc,
    ) {}

    /**
     * @param  array<int, array{order_product_id: int, quantity: float|int|string}>  $items
     * @param  bool  $refund  falso = devolución solo de stock (sin devolver dinero)
     *
     * @throws InvalidStockReturnException
     */
    public function create(
        OrderModel $order,
        array $items,
        ReturnReasonEnum $reason,
        ?string $note,
        ?int $createdBy,
        bool $refund = true,
        ?int $refundPaymentMethodId = null,
    ): OrderReturnModel {
        $quantities = $this->quantitiesByLine($items);

        // Lockea las líneas en orden de id para serializar devoluciones concurrentes sobre las mismas
        // líneas — sin esto, dos requests simultáneas podrían leer el mismo remanente y devolver,
        // juntas, más de lo vendido. El orden fijo evita deadlocks entre dos devoluciones que
        // comparten líneas.
        $lines = OrderProductModel::where(OrderProductModel::PEDIDO_ID, $order->id)
            ->whereIn('id', array_keys($quantities))
            ->orderBy('id')
            ->lockForUpdate()
            ->with(['product:id,nombre', 'addons'])
            ->get()
            ->keyBy('id');

        if ($lines->count() !== count($quantities)) {
            throw new InvalidStockReturnException('La orden no contiene alguno de los productos a devolver.');
        }

        $alreadyReturned = $this->alreadyReturned($lines);

        foreach ($quantities as $lineId => $quantity) {
            $line = $lines[$lineId];
            $remaining = round((float) $line->cantidad - ($alreadyReturned[$lineId] ?? 0), 3);

            if ($quantity > $remaining) {
                $name = $line->product?->nombre ?? 'el producto';

                throw new InvalidStockReturnException(
                    "La cantidad a devolver de \"{$name}\" excede lo disponible. Máximo devolvible: {$remaining}."
                );
            }
        }

        $amounts = $refund ? $this->refundAmounts($order, $lines, $quantities, $alreadyReturned) : [];
        $totalRefund = round(array_sum($amounts), 2);

        $balanceApplied = 0.0;
        $methodId = null;
        $sistemaId = null;
        $customer = $totalRefund > 0 ? $this->lockCreditCustomer($order) : null;
        if ($totalRefund > 0) {
            $balanceApplied = $customer ? round(min($totalRefund, max((float) $customer->balance, 0)), 2) : 0.0;
            if (round($totalRefund - $balanceApplied, 2) > 0) {
                $methodId = $refundPaymentMethodId ?? $order->payment_method_id;
                if (! $methodId) {
                    throw new InvalidStockReturnException('Selecciona el método con el que se devuelve el dinero.');
                }

                $sistemaId = (new MainOrderReportModel)->getActiveSale($order->sistema?->branch_id)?->id;
                if (! $sistemaId) {
                    throw new InvalidStockReturnException('Abre una caja para devolver dinero al cliente.');
                }
            }
        }

        // El saldo se descuenta hasta pasar todas las validaciones — un rechazo (ej. sin caja abierta) no
        // debe dejar al cliente con el adeudo ya reducido.
        if ($balanceApplied > 0) {
            $customer->decrement(CustomerModel::BALANCE, $balanceApplied);
        }

        $return = OrderReturnModel::create([
            OrderReturnModel::ORDER_ID => $order->id,
            OrderReturnModel::REASON => $reason,
            OrderReturnModel::NOTE => $note,
            OrderReturnModel::REFUND_AMOUNT => $totalRefund,
            OrderReturnModel::BALANCE_APPLIED => $balanceApplied,
            OrderReturnModel::REFUND_PAYMENT_METHOD_ID => $methodId,
            OrderReturnModel::SISTEMA_ID => $sistemaId,
            OrderReturnModel::CREATED_BY => $createdBy,
        ]);

        foreach ($quantities as $lineId => $quantity) {
            $this->returnLine($return, $lines[$lineId], $quantity, $amounts[$lineId] ?? 0.0, $reason, $note, $createdBy);
        }

        // Las demás pantallas abiertas refrescan sus listas (icono de "tiene devolución", detalle).
        OrdersUpdated::dispatchAfterCommit('updated', $order->id);

        return $return->load(['items', 'createdBy:id,nombre', 'refundPaymentMethod:id,name']);
    }

    /**
     * Dinero a devolver por cada línea. Una sola consulta agrupada con lo ya reembolsado de las líneas
     * — nunca una por línea.
     *
     * @param  Collection<int, OrderProductModel>  $lines
     * @param  array<int, float>  $quantities
     * @param  array<int, float>  $alreadyReturned
     * @return array<int, float>
     */
    private function refundAmounts(OrderModel $order, Collection $lines, array $quantities, array $alreadyReturned): array
    {
        $refunded = OrderReturnItemModel::whereIn(OrderReturnItemModel::ORDER_PRODUCT_ID, $lines->keys())
            ->where(OrderReturnItemModel::REFUND_AMOUNT, '>', 0)
            ->selectRaw('order_product_id, SUM(quantity) as quantity, SUM(refund_amount) as amount')
            ->groupBy('order_product_id')
            ->get()
            ->keyBy('order_product_id');

        $orderDiscount = (float) ($order->descuento ?? 0);
        $amounts = [];
        foreach ($quantities as $lineId => $quantity) {
            $line = $lines[$lineId];
            $amounts[$lineId] = $this->refundCalc->lineRefund(
                lineTotal: $this->refundCalc->lineTotal($line, $orderDiscount),
                soldQuantity: (float) $line->cantidad,
                quantity: $quantity,
                returnedQuantity: $alreadyReturned[$lineId] ?? 0.0,
                refundedQuantity: (float) ($refunded[$lineId]->quantity ?? 0),
                refundedAmount: (float) ($refunded[$lineId]->amount ?? 0),
            );
        }

        return $amounts;
    }

    /**
     * En una venta a crédito el cliente aún debe (parte de) lo que compró: el reembolso primero baja su
     * saldo, hasta lo que deba hoy. Devuelve al cliente bloqueado (null si la venta no es a crédito).
     * El lock evita que dos devoluciones simultáneas descuenten el mismo saldo dos veces.
     */
    private function lockCreditCustomer(OrderModel $order): ?CustomerModel
    {
        // Solo si el crédito de esta venta ya se cargó al cliente (credit_applied_at): si no, su saldo nunca la
        // incluyó y bajarlo reembolsaría una deuda que no existe.
        if (! $order->is_credit || ! $order->customer_id || ! $order->credit_applied_at) {
            return null;
        }

        return CustomerModel::where('id', $order->customer_id)->lockForUpdate()->first();
    }

    /**
     * Junta las líneas repetidas del request y valida que ninguna cantidad sea cero o negativa.
     *
     * @param  array<int, array{order_product_id: int, quantity: float|int|string}>  $items
     * @return array<int, float> cantidad a devolver por id de línea, ordenado por id
     *
     * @throws InvalidStockReturnException
     */
    private function quantitiesByLine(array $items): array
    {
        $quantities = [];
        foreach ($items as $item) {
            $lineId = (int) $item['order_product_id'];
            $quantities[$lineId] = ($quantities[$lineId] ?? 0) + (float) $item['quantity'];
        }

        if ($quantities === []) {
            throw new InvalidStockReturnException('Selecciona al menos un producto a devolver.');
        }

        foreach ($quantities as $quantity) {
            if ($quantity <= 0) {
                throw new InvalidStockReturnException('La cantidad a devolver debe ser mayor a cero.');
            }
        }

        ksort($quantities);

        return $quantities;
    }

    /**
     * Cantidad ya devuelta por línea, en una sola consulta — nunca una por línea.
     *
     * @param  Collection<int, OrderProductModel>  $lines
     * @return array<int, float>
     */
    private function alreadyReturned(Collection $lines): array
    {
        return StockMovementModel::where('reference_type', OrderProductModel::class)
            ->whereIn('reference_id', $lines->keys())
            ->where(StockMovementModel::REASON, StockMovementReasonEnum::Return)
            ->selectRaw('reference_id, SUM('.StockMovementModel::QUANTITY.') as returned')
            ->groupBy('reference_id')
            ->pluck('returned', 'reference_id')
            ->map(fn ($returned): float => (float) $returned)
            ->all();
    }

    private function returnLine(
        OrderReturnModel $return,
        OrderProductModel $line,
        float $quantity,
        float $refundAmount,
        ReturnReasonEnum $reason,
        ?string $note,
        ?int $createdBy,
    ): void {
        OrderReturnItemModel::create([
            OrderReturnItemModel::ORDER_RETURN_ID => $return->id,
            OrderReturnItemModel::ORDER_PRODUCT_ID => $line->id,
            OrderReturnItemModel::QUANTITY => $quantity,
            OrderReturnItemModel::REFUND_AMOUNT => $refundAmount,
        ]);

        $this->stockService->restore(
            productId: $line->producto_id,
            quantity: $quantity,
            reason: StockMovementReasonEnum::Return,
            variantId: $line->variant_id,
            reference: $line,
            createdBy: $createdBy,
            note: $note,
            orderReturnId: $return->id,
        );

        if (! $reason->returnsToSellableStock()) {
            $this->stockService->deduct(
                productId: $line->producto_id,
                quantity: $quantity,
                reason: StockMovementReasonEnum::Loss,
                variantId: $line->variant_id,
                reference: $line,
                createdBy: $createdBy,
                note: 'Devolución defectuosa',
                orderReturnId: $return->id,
            );
        }
    }
}
