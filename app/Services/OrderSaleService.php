<?php

namespace App\Services;

use App\Enums\ActivityTypeEnum;
use App\Enums\OrderStatusEnum;
use App\Models\OrderModel;
use App\Models\OrderProductModel;
use App\Models\ProductModel;
use App\Models\ProductVariantModel;
use Carbon\Carbon;

class OrderSaleService
{
    public function __construct(private readonly TenantActivityService $activityService) {}

    /**
     * Crea y cierra una venta en un solo paso: orden + productos + total, todo Closed.
     *
     * @param  array{sistema_id:int, nombre_pedido:string, costo_domicilio?:float, items:array}  $data
     */
    public function createDirectSale(array $data): OrderModel
    {
        $items = collect($data['items'])->map(function ($item) {
            $item['precio'] = $this->resolveCatalogPrice($item['producto_id'], $item['variant_id'] ?? null);

            return $item;
        });

        $subtotal = $items->sum(fn ($i) => $i['precio'] * $i['cantidad']);

        $order = OrderModel::create([
            OrderModel::SISTEMA_ID => $data['sistema_id'],
            OrderModel::NOMBRE_PEDIDO => $data['nombre_pedido'],
            OrderModel::SUBTOTAL => $subtotal,
            OrderModel::TOTAL => $subtotal,
            OrderModel::COSTO_DOMICILIO => $data['costo_domicilio'] ?? 0,
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::IN_PROCESS->value,
        ]);

        foreach ($items as $item) {
            OrderProductModel::create([
                OrderProductModel::PEDIDO_ID => $order->id,
                OrderProductModel::PRODUCTO_ID => $item['producto_id'],
                OrderProductModel::VARIANT_ID => $item['variant_id'] ?? null,
                OrderProductModel::CANTIDAD => $item['cantidad'],
                OrderProductModel::PRECIO => $item['precio'],
            ]);
        }

        $order->update([
            OrderModel::ESTATUS_PEDIDO_ID => OrderStatusEnum::CLOSED->value,
        ]);

        $this->activityService->log($order->tenant_id, ActivityTypeEnum::SALE_CLOSED);

        return $order;
    }

    /**
     * resolveCatalogPrice — el precio de un item de venta directa nunca se toma
     * del cliente: se resuelve desde la variante seleccionada o desde el precio
     * base del producto.
     */
    private function resolveCatalogPrice(int $productId, ?int $variantId): float
    {
        if ($variantId) {
            return (float) ProductVariantModel::findOrFail($variantId)->precio;
        }

        return (float) ProductModel::findOrFail($productId)->precio;
    }

    /**
     * Reporte de ventas por categoría. Al menos uno de $sistemaId/$date/$month/$week debe venir:
     * - Solo $sistemaId (sin fecha, semana ni mes): totales de esa sesión puntual (uso en CloseSales).
     * - Con $date: agrega TODAS las sesiones cerradas ese día (uso en SalesPage — vista
     *   histórica que no está atada a la sesión actualmente activa en el navegador).
     * - Con $week (lunes, formato YYYY-MM-DD): agrega todas las sesiones cerradas de esa semana.
     * - Con $month (formato YYYY-MM): agrega todas las sesiones cerradas de ese mes.
     */
    public function salesByCategory(?int $sistemaId, ?string $date, ?string $month = null, ?string $week = null): array
    {
        $query = OrderProductModel::query()
            ->join('order as o', 'o.id', '=', 'order_product.pedido_id')
            ->join('product', 'product.id', '=', 'order_product.producto_id')
            ->join('categories', 'categories.id', '=', 'product.categoria_id')
            ->where('o.tenant_id', app('tenant_id'))
            ->where('o.estatus_pedido_id', OrderStatusEnum::CLOSED->value);

        if ($sistemaId) {
            $query->where('o.sistema_id', $sistemaId);
        }

        $this->applyPeriod($query, 'o.created_at', $date, $month, $week);

        $categories = $query
            ->groupBy('categories.id', 'categories.nombre')
            ->selectRaw('categories.id, categories.nombre, SUM(order_product.cantidad) as total_cantidad, ROUND(SUM(order_product.precio * order_product.cantidad * (1 - COALESCE(order_product.descuento, 0) / 100) * (1 - COALESCE(o.descuento, 0) / 100)), 2) as total_revenue')
            ->orderByDesc('total_revenue')
            ->get();

        $domiciliosQuery = OrderModel::query()
            ->where(OrderModel::ESTATUS_PEDIDO_ID, OrderStatusEnum::CLOSED->value)
            ->where(OrderModel::COSTO_DOMICILIO, '<', 0);

        if ($sistemaId) {
            $domiciliosQuery->where(OrderModel::SISTEMA_ID, $sistemaId);
        }

        $this->applyPeriod($domiciliosQuery, 'created_at', $date, $month, $week);

        $domicilios = (float) round(
            $domiciliosQuery->selectRaw('ABS(SUM(costo_domicilio)) as total')->value('total') ?? 0,
            2
        );

        return [
            'categories' => $categories,
            'domicilios' => $domicilios,
        ];
    }

    /**
     * Aplica el filtro de fecha puntual, semana (lunes YYYY-MM-DD) o mes (YYYY-MM) sobre la columna dada.
     */
    private function applyPeriod($query, string $column, ?string $date, ?string $month, ?string $week = null): void
    {
        if ($date) {
            $query->whereDate($column, $date);
        } elseif ($week) {
            $query->whereBetween($column, [
                Carbon::parse($week)->startOfDay(),
                Carbon::parse($week)->addDays(6)->endOfDay(),
            ]);
        } elseif ($month) {
            [$year, $monthNumber] = explode('-', $month);
            $query->whereYear($column, (int) $year)->whereMonth($column, (int) $monthNumber);
        }
    }
}
