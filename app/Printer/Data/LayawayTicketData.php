<?php

namespace App\Printer\Data;

use App\Enums\LayawayPaymentTypeEnum;
use App\Models\OrderModel;
use App\Printer\Dto\TicketDataInterface;
use Carbon\Carbon;

/**
 * Comprobante de apartado: los mismos datos del ticket de venta (productos, totales, negocio) más
 * el bloque del apartado — cliente, historial de abonos/reembolsos, abonado, saldo y fecha límite.
 */
class LayawayTicketData implements TicketDataInterface
{
    public function __construct(private readonly OrderModel $order) {}

    public function getType(): string
    {
        return 'layaway';
    }

    public function toArray(): array
    {
        $payments = $this->order->layawayPayments()->with('paymentMethod:id,name')->get();
        $timezone = config('app.timezone');

        return array_merge((new VentaTicketData($this->order))->toArray(), [
            'layaway' => [
                'status' => (int) $this->order->estatus_pedido_id,
                'customer_name' => $this->order->customer?->name,
                'amount_paid' => (float) $this->order->amount_paid,
                'pending' => max(round((float) $this->order->total - (float) $this->order->amount_paid, 2), 0),
                'due_date' => $this->order->layaway_due_date?->format('d/m/Y'),
                'payments' => $payments->map(fn ($payment): array => [
                    'fecha' => Carbon::parse($payment->created_at)->setTimezone($timezone)->format('d/m'),
                    'is_refund' => $payment->type === LayawayPaymentTypeEnum::Refund,
                    'method' => $payment->paymentMethod?->name,
                    'amount' => (float) $payment->amount,
                ])->all(),
            ],
        ]);
    }
}
