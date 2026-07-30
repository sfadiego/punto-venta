<?php

namespace App\Services;

use App\Models\CustomerModel;
use App\Models\OrderModel;

class OrderCreditService
{
    /**
     * Al cerrar una venta a crédito, incrementa el balance del cliente una sola vez.
     * `credit_applied_at` actúa como guardia de idempotencia: si update() se llama
     * varias veces sobre la misma orden (ej. reintentos), el balance no se duplica.
     */
    public function applyIfClosingAsCredit(OrderModel $order, bool $becomingClosed): void
    {
        $shouldApply = $becomingClosed
            && $order->is_credit
            && $order->customer_id
            && is_null($order->credit_applied_at);

        if (! $shouldApply) {
            return;
        }

        // Re-lock la orden por id (no la instancia ya cargada) para que dos requests
        // concurrentes cerrando la misma orden se serialicen aquí: la segunda encuentra
        // credit_applied_at ya seteado por la primera y no vuelve a incrementar el balance.
        $stillPending = OrderModel::where('id', $order->id)
            ->whereNull(OrderModel::CREDIT_APPLIED_AT)
            ->lockForUpdate()
            ->exists();

        if (! $stillPending) {
            return;
        }

        $customer = CustomerModel::where('id', $order->customer_id)->lockForUpdate()->first();

        if ($customer) {
            $customer->increment('balance', $order->total);
            OrderModel::where('id', $order->id)->update([OrderModel::CREDIT_APPLIED_AT => now()]);
            $order->forceFill(['credit_applied_at' => now()]);
        }
    }
}
