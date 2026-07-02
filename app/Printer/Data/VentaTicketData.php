<?php

namespace App\Printer\Data;

use App\Models\BusinessConfigModel;
use App\Models\OrderModel;
use App\Printer\Dto\TicketDataInterface;
use Carbon\Carbon;

class VentaTicketData implements TicketDataInterface
{
    private OrderModel $venta;

    public function __construct(OrderModel $venta)
    {
        $this->venta = $venta;
    }

    public function getType(): string
    {
        return 'venta';
    }

    private static function fechaString(\DateTimeInterface|string $createdAt): string
    {
        $meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        $date = Carbon::parse($createdAt)->setTimezone(config('app.timezone'));

        return $date->day.' de '.$meses[$date->month - 1].' del '.$date->year;
    }

    public function toArray(): array
    {
        $order = $this->venta->load('orderProducts.product');
        $config = BusinessConfigModel::find($order->tenant_id);

        $products = $order->orderProducts->map(function ($item): array {
            $cantidad = (float) $item->cantidad;
            $lineTotal = (float) $item->precio * $cantidad;
            $discount = $lineTotal * ((float) $item->descuento / 100);
            $unidad = $item->product?->unidad_medida?->value ?? 'unidad';

            return [
                'nombre' => $item->nombre_extra ?? $item->product?->nombre ?? '—',
                'cantidad' => $cantidad,
                'unidad_medida' => $unidad,
                'precio' => (float) $item->precio,
                'descuento' => (float) $item->descuento,
                'total' => round($lineTotal - $discount, 2),
                'es_extra' => ! is_null($item->nombre_extra),
                'observacion' => $item->observacion,
            ];
        })->toArray();

        return [
            'id' => $order->id,
            'nombre_pedido' => $order->nombre_pedido,
            'subtotal' => (float) $order->subtotal,
            'descuento' => (float) $order->descuento,
            'total' => (float) $order->total,
            'costo_domicilio' => (float) ($order->costo_domicilio ?? 0),
            'created_at' => $order->created_at,
            'fecha_string' => self::fechaString($order->created_at),
            'hora' => Carbon::parse($order->created_at)->setTimezone(config('app.timezone'))->format('H:i'),
            'products' => $products,
            'business' => [
                'name' => $config?->business_name ?? env('APP_FULL_NAME', 'Punto de venta'),
                'phone' => $config?->phone,
                'address' => $config?->address,
                'facebook' => $config?->facebook,
                'instagram' => $config?->instagram,
                'whatsapp' => $config?->whatsapp,
                'website' => $config?->website,
                'ticket_footer' => $config?->ticket_footer,
            ],
        ];
    }
}
