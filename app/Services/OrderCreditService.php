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

        $customer = CustomerModel::where('id', $order->customer_id)->lockForUpdate()->first();

        if ($customer) {
            $customer->increment('balance', $order->total);
            $order->forceFill(['credit_applied_at' => now()])->save();
        }
    }
}
