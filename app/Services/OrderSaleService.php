<?php

namespace App\Services;

use App\Enums\OrderStatusEnum;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class OrderSaleService
{
    /**
     * Crea y cierra una venta en un solo paso: orden + productos + total, todo Closed.
     *
     * @param  array{sistema_id:int, nombre_pedido:string, costo_domicilio?:float, items:array}  $data
     */
    public function createDirectSale(array $data): OrderModel
    {
        return DB::transaction(function () use ($data) {
            $subtotal = collect($data['items'])->sum(fn ($i) => $i['precio'] * $i['cantidad']);

            $order = OrderModel::create([
                OrderModel::SISTEMA_ID => $data['sistema_id'],
                OrderModel::NOMBRE_PEDIDO => $data['nombre_pedido'],
                OrderModel::SUBTOTAL => $subtotal,
                OrderModel::TOTAL => $subtotal,
                OrderModel::COSTO_DOMICILIO => $data['costo_domicilio'] ?? 0,
                OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
            ]);

            foreach ($data['items'] as $item) {
                OrderProductModel::create([
                    OrderProductModel::PEDIDO_ID => $order->id,
                    OrderProductModel::PRODUCTO_ID => $item['producto_id'],
                    OrderProductModel::CANTIDAD => $item['cantidad'],
                    OrderProductModel::PRECIO => $item['precio'],
                ]);
            }

            $order->update([
                OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
            ]);

            return $order;
        });
    }

    public function salesByCategory(int $sistemaId, ?string $date): Collection
    {
        $query = OrderProductModel::query()
            ->join('order as o', 'o.id', '=', 'order_product.pedido_id')
            ->join('product', 'product.id', '=', 'order_product.producto_id')
            ->join('categories', 'categories.id', '=', 'product.categoria_id')
            ->where('o.sistema_id', $sistemaId)
            ->where('o.estatus_pedido_id', OrderStatusEnum::CLOSED->value);

        if ($date) {
            $query->whereDate('o.created_at', $date);
        }

        return $query
            ->groupBy('categories.id', 'categories.nombre')
            ->selectRaw('categories.id, categories.nombre, SUM(order_product.cantidad) as total_cantidad, ROUND(SUM(order_product.precio * order_product.cantidad * (1 - COALESCE(order_product.descuento, 0) / 100) * (1 - COALESCE(o.descuento, 0) / 100)), 2) as total_revenue')
            ->orderByDesc('total_revenue')
            ->get();
    }
}
