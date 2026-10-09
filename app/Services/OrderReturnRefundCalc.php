<?php

namespace App\Services;

use App\Models\OrderProductModel;

/**
 * Cálculo del dinero que se devuelve por una devolución: lo que el cliente realmente pagó por las
 * piezas devueltas — precio con extras, descuento de la línea y descuento de la orden. Nunca incluye
 * propina ni domicilio. Mismo redondeo por línea que OrderProductService::lineSubtotal().
 */
class OrderReturnRefundCalc
{
    // Tolerancia al comparar cantidades decimales (peso/volumen) al decidir si una devolución agota la línea.
    private const EPSILON = 0.0005;

    /** Lo que pagó el cliente por la línea completa. */
    public function lineTotal(OrderProductModel $line, float $orderDiscount): float
    {
        $subtotal = round($line->unitPriceWithAddons() * (float) $line->cantidad * (1 - (float) $line->descuento / 100), 2);

        return round($subtotal * (1 - $orderDiscount / 100), 2);
    }

    /**
     * Reembolso de $quantity piezas de una línea. Proporcional a lo vendido; si esta devolución agota
     * la línea y todo lo devuelto antes también se reembolsó, devuelve exactamente lo que falta para
     * no perder centavos por redondeo. Nunca excede lo que queda por reembolsar de la línea.
     *
     * @param  float  $returnedQuantity  piezas ya devueltas (con o sin dinero)
     * @param  float  $refundedQuantity  de esas, las que sí se reembolsaron
     * @param  float  $refundedAmount  dinero ya reembolsado de la línea
     */
    public function lineRefund(
        float $lineTotal,
        float $soldQuantity,
        float $quantity,
        float $returnedQuantity,
        float $refundedQuantity,
        float $refundedAmount,
    ): float {
        if ($soldQuantity <= 0) {
            return 0.0;
        }

        $remainingRefundable = max(0.0, round($lineTotal - $refundedAmount, 2));
        $exhaustsLine = $quantity + $returnedQuantity >= $soldQuantity - self::EPSILON;
        $everythingBeforeWasRefunded = abs($returnedQuantity - $refundedQuantity) < self::EPSILON;

        if ($exhaustsLine && $everythingBeforeWasRefunded) {
            return $remainingRefundable;
        }

        return min($remainingRefundable, round($lineTotal * $quantity / $soldQuantity, 2));
    }
}
