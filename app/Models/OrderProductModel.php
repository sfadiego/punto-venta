<?php

namespace App\Models;

use App\Enums\OrderStatusEnum;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\DB;

class OrderProductModel extends Model
{
    use HasFactory;

    protected $table = 'order_product';

    const PRODUCTO_ID = 'producto_id';

    const VARIANT_ID = 'variant_id';

    const PEDIDO_ID = 'pedido_id';

    const DESCUENTO = 'descuento';

    const CANTIDAD = 'cantidad';

    const PRECIO = 'precio';

    const NOMBRE_EXTRA = 'nombre_extra';

    const OBSERVACION = 'observacion';

    const IS_READY = 'is_ready';

    protected $fillable = [
        self::PRODUCTO_ID,
        self::VARIANT_ID,
        self::PEDIDO_ID,
        self::DESCUENTO,
        self::CANTIDAD,
        self::PRECIO,
        self::NOMBRE_EXTRA,
        self::OBSERVACION,
        self::IS_READY,
    ];

    protected $casts = [
        self::IS_READY => 'boolean',
    ];

    public function product(): HasOne
    {
        return $this->hasOne(ProductModel::class, 'id', self::PRODUCTO_ID);
    }

    public function variant(): HasOne
    {
        return $this->hasOne(ProductVariantModel::class, 'id', self::VARIANT_ID);
    }

    /** Toppings elegidos en esta línea (con copia de nombre y precio del momento de la venta). */
    public function addons(): HasMany
    {
        return $this->hasMany(OrderProductAddonModel::class, OrderProductAddonModel::ORDER_PRODUCT_ID);
    }

    /** Suma de los toppings por UNA unidad de la línea. */
    public function addonsUnitTotal(): float
    {
        $addons = $this->relationLoaded('addons') ? $this->addons : $this->addons()->get();

        return round($addons->sum(fn (OrderProductAddonModel $addon) => $addon->price * $addon->quantity), 2);
    }

    /** Precio de una unidad ya con sus toppings: lo que se multiplica por cantidad y descuento. */
    public function unitPriceWithAddons(): float
    {
        return round((float) $this->precio + $this->addonsUnitTotal(), 2);
    }

    // Inverso del morphTo StockMovementModel::reference() — usado por OrderService para
    // marcar en el listado qué órdenes tienen alguna devolución (ver Fase 10 del plan de
    // Inventario).
    public function stockMovements(): MorphMany
    {
        return $this->morphMany(StockMovementModel::class, 'reference');
    }

    public static function top3BestSeller(?Carbon $start = null, ?Carbon $end = null, ?int $sistemaId = null, ?int $branchId = null)
    {
        $query = OrderProductModel::whereHas('product')
            ->with(['product'])
            ->join('order', 'order.id', '=', 'order_product.pedido_id')
            ->where('order.estatus_pedido_id', OrderStatusEnum::CLOSED->value)
            // Unidades netas: las devueltas con reembolso se restan (una devolución solo de stock no anula la venta).
            ->select(DB::raw('SUM(order_product.cantidad - COALESCE((SELECT SUM(i.quantity) FROM order_return_items i WHERE i.order_product_id = order_product.id AND i.refund_amount > 0), 0)) as sumatoria'), 'order_product.producto_id')
            ->when($start && $end, fn ($q) => $q->whereBetween('order_product.created_at', [$start, $end]))
            ->when($sistemaId, fn ($q) => $q->where('order.sistema_id', $sistemaId))
            ->when($branchId, fn ($q) => $q->join('main_order_report', 'main_order_report.id', '=', 'order.sistema_id')
                ->where('main_order_report.branch_id', $branchId))
            ->groupBy('order_product.producto_id')
            ->having('sumatoria', '>', 0)
            ->orderByDesc('sumatoria')
            ->limit(3)
            ->get();

        return $query->map(function ($item) {
            $unidad = $item->product?->unidad_medida?->value ?? 'unidad';
            $esPeso = in_array($unidad, ['kg', 'gr', 'litro']);

            return [
                'id' => $item->producto_id,
                'product' => $item->product->nombre,
                'total' => $esPeso ? round((float) $item->sumatoria, 3) : (int) $item->sumatoria,
                'unidad_medida' => $unidad,
            ];
        });
    }
}
