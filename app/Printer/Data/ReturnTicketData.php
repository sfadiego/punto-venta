<?php

namespace App\Printer\Data;

use App\Models\BusinessConfigModel;
use App\Models\OrderReturnModel;
use App\Printer\Dto\TicketDataInterface;
use Carbon\Carbon;

/**
 * Comprobante de devolución: lo que el cliente devolvió, el motivo y el reembolso — total, la parte
 * que salió por método de pago y la que bajó su saldo de crédito. No repite el ticket de la venta.
 */
class ReturnTicketData implements TicketDataInterface
{
    public function __construct(private readonly OrderReturnModel $orderReturn) {}

    public function getType(): string
    {
        return 'return';
    }

    public function toArray(): array
    {
        $return = $this->orderReturn->load([
            'order.customer:id,name',
            'createdBy:id,nombre',
            'refundPaymentMethod:id,name',
            'items.orderProduct.product:id,nombre,unidad_medida',
            'items.orderProduct.variant:id,nombre',
        ]);
        $config = BusinessConfigModel::find($return->tenant_id);
        $date = Carbon::parse($return->created_at)->setTimezone(config('app.timezone'));

        return [
            'id' => $return->id,
            'order_id' => $return->order_id,
            'fecha_string' => $date->format('d/m/Y'),
            'hora' => $date->format('H:i'),
            'customer_name' => $return->order?->customer?->name,
            'attended_by' => $return->createdBy?->nombre,
            'reason' => $return->reason->label(),
            // Una pieza defectuosa no vuelve al stock vendible: se da de baja como merma.
            'returns_to_stock' => $return->reason->returnsToSellableStock(),
            'note' => $return->note,
            'items' => $return->items->map(function ($item): array {
                $line = $item->orderProduct;
                $name = ($line?->product?->nombre ?? $line?->nombre_extra ?? '—').($line?->variant ? ' ('.$line->variant->nombre.')' : '');

                return [
                    'nombre' => $name,
                    'cantidad' => (float) $item->quantity,
                    'unidad_medida' => $line?->product?->unidad_medida?->value ?? 'unidad',
                    'refund' => (float) $item->refund_amount,
                ];
            })->all(),
            'refund_amount' => (float) $return->refund_amount,
            'balance_applied' => (float) $return->balance_applied,
            'method_amount' => round((float) $return->refund_amount - (float) $return->balance_applied, 2),
            'method_name' => $return->refundPaymentMethod?->name,
            'business' => VentaTicketData::businessData($config),
        ];
    }
}
