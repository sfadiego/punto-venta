<?php

namespace App\Services;

use App\Enums\ActivityTypeEnum;
use App\Enums\LayawayPaymentTypeEnum;
use App\Enums\OrderStatusEnum;
use App\Enums\StockMovementReasonEnum;
use App\Events\OrdersUpdated;
use App\Exceptions\InsufficientStockException;
use App\Exceptions\InvalidLayawayException;
use App\Models\BusinessConfigModel;
use App\Models\MainOrderReportModel;
use App\Models\OrderLayawayPaymentModel;
use App\Models\OrderModel;
use Carbon\Carbon;

/**
 * Apartados (retail): el cliente paga un anticipo y se lleva el producto al liquidar. El stock
 * se descuenta al crear el apartado y se restituye al cancelarlo; liquidar solo cierra la venta
 * (no vuelve a descontar). Cada movimiento de dinero queda en order_layaway_payments con la caja
 * (sistema_id) donde se recibió o devolvió.
 */
class LayawayService
{
    private const DEFAULT_MIN_PERCENT = 10.0;

    private const DEFAULT_DAYS = 30;

    // Días de anticipación desde los que un apartado cuenta como "por vencer" — espejo de
    // LAYAWAY_SOON_DAYS en resources/js/utils/layawayCalc.ts.
    private const DUE_SOON_DAYS = 7;

    // Tolerancia para comparar montos decimales redondeados a centavos.
    private const EPSILON = 0.004;

    public function __construct(
        private readonly OrderStockService $orderStockService,
        private readonly TenantActivityService $activityService,
    ) {}

    /**
     * @throws InvalidLayawayException
     * @throws InsufficientStockException
     */
    public function create(
        OrderModel $order,
        int $customerId,
        float $amount,
        int $paymentMethodId,
        int $sistemaId,
        ?string $dueDate = null,
        ?string $note = null,
    ): OrderModel {
        $order = $this->lockOrder($order);

        if ($order->estatus_pedido_id !== OrderStatusEnum::IN_PROCESS->value) {
            throw new InvalidLayawayException('Solo una orden en proceso puede apartarse.');
        }

        $this->assertSameBranch($order, $sistemaId);

        $detail = $order->totalAndSubTotalOrder();
        $total = round((float) $detail['total'], 2);
        $amount = round($amount, 2);

        if ($total <= 0) {
            throw new InvalidLayawayException('La orden no tiene productos.');
        }

        $minimum = $this->minimumDeposit($total);
        if ($amount + self::EPSILON < $minimum) {
            throw new InvalidLayawayException('El anticipo mínimo es de $'.number_format($minimum, 2).'.');
        }

        if ($amount >= $total - self::EPSILON) {
            throw new InvalidLayawayException('El anticipo debe ser menor al total; para cobrar completo usa una venta normal.');
        }

        // Si algún producto ya no alcanza, falla antes de tocar la orden o registrar dinero.
        $this->orderStockService->deductForOrder($order, StockMovementReasonEnum::Layaway);

        $order->update([
            OrderModel::TOTAL => $total,
            OrderModel::SUBTOTAL => $detail['subtotal'],
            OrderModel::CUSTOMER_ID => $customerId,
            OrderModel::AMOUNT_PAID => $amount,
            OrderModel::LAYAWAY_DUE_DATE => $dueDate ?? $this->defaultDueDate(),
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::LAYAWAY->value,
        ]);

        $this->recordMovement($order, LayawayPaymentTypeEnum::Deposit, $amount, $paymentMethodId, $sistemaId, $note);

        OrdersUpdated::dispatchAfterCommit('updated', $order->id);

        return $this->fresh($order);
    }

    /**
     * Registra un abono; si cubre el saldo pendiente, liquida y cierra la venta.
     *
     * @throws InvalidLayawayException
     */
    public function addPayment(OrderModel $order, float $amount, int $paymentMethodId, int $sistemaId, ?string $note = null): OrderModel
    {
        $order = $this->lockOrder($order);

        if ($order->estatus_pedido_id !== OrderStatusEnum::LAYAWAY->value) {
            throw new InvalidLayawayException('La orden no es un apartado activo.');
        }

        $this->assertSameBranch($order, $sistemaId);

        $amount = round($amount, 2);
        $pending = round((float) $order->total - (float) $order->amount_paid, 2);

        if ($amount > $pending + self::EPSILON) {
            throw new InvalidLayawayException('El abono no puede exceder el saldo pendiente ($'.number_format($pending, 2).').');
        }

        $this->recordMovement($order, LayawayPaymentTypeEnum::Deposit, $amount, $paymentMethodId, $sistemaId, $note);

        $paid = round((float) $order->amount_paid + $amount, 2);
        $changes = [OrderModel::AMOUNT_PAID => $paid];

        $settled = $paid >= (float) $order->total - self::EPSILON;
        if ($settled) {
            // El stock ya se descontó al crear el apartado — aquí solo se concreta la venta.
            $changes[OrderModel::ESTATUS_PEDIDO_ID] = OrderStatusEnum::CLOSED->value;
            $changes[OrderModel::PAYMENT_METHOD_ID] = $paymentMethodId;
            // La venta se concreta en la sesión de caja donde se liquida (no en la que se
            // apartó): así aparece entre las ventas cerradas de esa sesión. Su dinero se cuenta
            // por abonos (MainOrderReportModel::layawaySummary), no por order.total.
            $changes[OrderModel::SISTEMA_ID] = $sistemaId;
        }

        $order->update($changes);

        if ($settled) {
            $this->activityService->log($order->tenant_id, ActivityTypeEnum::SALE_CLOSED);
        }

        OrdersUpdated::dispatchAfterCommit('updated', $order->id);

        return $this->fresh($order);
    }

    /**
     * Cancela el apartado: devuelve el stock y reembolsa lo abonado, salvo la parte que el negocio
     * retiene ($retainedAmount, entre 0 y lo abonado; sin él se reembolsa todo). El reembolso sale
     * de la caja $sistemaId, en el método indicado o, por defecto, en el del último abono; lo
     * retenido queda en el historial como "forfeit" y no mueve la caja (ya entró al cobrar el abono).
     *
     * @throws InvalidLayawayException
     */
    public function cancel(OrderModel $order, int $sistemaId, ?int $paymentMethodId = null, ?string $note = null, ?float $retainedAmount = null): OrderModel
    {
        $order = $this->lockOrder($order);

        if ($order->estatus_pedido_id !== OrderStatusEnum::LAYAWAY->value) {
            throw new InvalidLayawayException('La orden no es un apartado activo.');
        }

        $this->assertSameBranch($order, $sistemaId);

        $paid = round((float) $order->amount_paid, 2);
        $retained = round($retainedAmount ?? 0, 2);
        if ($retained < 0 || $retained > $paid + self::EPSILON) {
            throw new InvalidLayawayException('La retención no puede exceder lo abonado ($'.number_format($paid, 2).').');
        }
        $retained = min($retained, $paid);
        $refund = round($paid - $retained, 2);

        $this->orderStockService->restoreForOrder($order, StockMovementReasonEnum::LayawayCancel);

        $lastDepositMethodId = $order->layawayPayments()->where(OrderLayawayPaymentModel::TYPE, LayawayPaymentTypeEnum::Deposit)->latest('id')->value(OrderLayawayPaymentModel::PAYMENT_METHOD_ID);

        if ($refund > 0) {
            $this->recordMovement($order, LayawayPaymentTypeEnum::Refund, $refund, $paymentMethodId ?? $lastDepositMethodId, $sistemaId, $note);
        }

        if ($retained > 0) {
            $this->recordMovement($order, LayawayPaymentTypeEnum::Forfeit, $retained, $lastDepositMethodId, $sistemaId, $note);
        }

        $order->update([
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CANCELED->value,
            // Lo que el negocio conserva de este apartado (0 si se reembolsó todo).
            OrderModel::AMOUNT_PAID => $retained,
        ]);

        OrdersUpdated::dispatchAfterCommit('updated', $order->id);

        return $this->fresh($order);
    }

    /**
     * Resumen de apartados activos para las tarjetas del listado: cuántos hay, saldo por cobrar
     * y cuántos ya vencieron. Con $branchId se acota a las cajas (sesiones) de esa sucursal.
     *
     * @return array{active_count: int, pending_balance: float, overdue_count: int, due_soon_count: int}
     */
    public function summary(?int $branchId = null): array
    {
        $totals = OrderModel::where(OrderModel::ESTATUS_PEDIDO_ID, OrderStatusEnum::LAYAWAY->value)
            ->when($branchId, fn ($q) => $q->whereHas('sistema', fn ($s) => $s->where(MainOrderReportModel::BRANCH_ID, $branchId)))
            ->selectRaw(
                'COUNT(*) as active_count, COALESCE(SUM(total - amount_paid), 0) as pending_balance, '
                .'COALESCE(SUM(CASE WHEN layaway_due_date < ? THEN 1 ELSE 0 END), 0) as overdue_count, '
                .'COALESCE(SUM(CASE WHEN layaway_due_date >= ? AND layaway_due_date <= ? THEN 1 ELSE 0 END), 0) as due_soon_count',
                [
                    Carbon::today()->toDateString(),
                    Carbon::today()->toDateString(),
                    Carbon::today()->addDays(self::DUE_SOON_DAYS)->toDateString(),
                ]
            )
            ->first();

        return [
            'active_count' => (int) $totals->active_count,
            'pending_balance' => round((float) $totals->pending_balance, 2),
            'overdue_count' => (int) $totals->overdue_count,
            'due_soon_count' => (int) $totals->due_soon_count,
        ];
    }

    /** Anticipo mínimo en pesos según el % configurado del negocio (10% por defecto). */
    public function minimumDeposit(float $total): float
    {
        $percent = BusinessConfigModel::find(app('tenant_id'))?->layaway_min_percent ?? self::DEFAULT_MIN_PERCENT;

        return round($total * $percent / 100, 2);
    }

    private function defaultDueDate(): string
    {
        $days = BusinessConfigModel::find(app('tenant_id'))?->layaway_days ?? self::DEFAULT_DAYS;

        return Carbon::today()->addDays($days)->toDateString();
    }

    private function recordMovement(
        OrderModel $order,
        LayawayPaymentTypeEnum $type,
        float $amount,
        ?int $paymentMethodId,
        int $sistemaId,
        ?string $note,
    ): OrderLayawayPaymentModel {
        return OrderLayawayPaymentModel::create([
            OrderLayawayPaymentModel::ORDER_ID => $order->id,
            OrderLayawayPaymentModel::CUSTOMER_ID => $order->customer_id,
            OrderLayawayPaymentModel::TYPE => $type,
            OrderLayawayPaymentModel::AMOUNT => $amount,
            OrderLayawayPaymentModel::PAYMENT_METHOD_ID => $paymentMethodId,
            OrderLayawayPaymentModel::SISTEMA_ID => $sistemaId,
            OrderLayawayPaymentModel::CREATED_BY => auth()->id(),
            OrderLayawayPaymentModel::NOTE => $note,
        ]);
    }

    /**
     * Con sucursales activas, el dinero de un apartado solo puede moverse en cajas de la misma
     * sucursal que la orden — de lo contrario el efectivo de una sucursal terminaría en el
     * cuadre de otra.
     */
    private function assertSameBranch(OrderModel $order, int $sistemaId): void
    {
        $orderBranchId = MainOrderReportModel::find($order->sistema_id)?->branch_id;
        $cashBranchId = MainOrderReportModel::find($sistemaId)?->branch_id;

        if ($orderBranchId !== $cashBranchId) {
            throw new InvalidLayawayException('La caja seleccionada pertenece a otra sucursal.');
        }
    }

    // Re-lock por id (no la instancia ya cargada): dos requests concurrentes sobre el mismo
    // apartado se serializan aquí y la segunda ve el estado ya actualizado por la primera.
    private function lockOrder(OrderModel $order): OrderModel
    {
        return OrderModel::where('id', $order->id)->lockForUpdate()->firstOrFail();
    }

    private function fresh(OrderModel $order): OrderModel
    {
        return $order->fresh(['layawayPayments.paymentMethod:id,name', 'customer:id,name,phone', 'paymentMethod:id,name']);
    }
}
