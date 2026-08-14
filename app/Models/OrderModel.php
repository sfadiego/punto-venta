<?php

namespace App\Models;

use App\Enums\OrderStatusEnum;
use App\Models\Traits\HasTenant;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class OrderModel extends Model
{
    use HasFactory, HasTenant, SoftDeletes;

    protected $table = 'order';

    const NOMBRE_PEDIDO = 'nombre_pedido';

    const TOTAL = 'total';

    const SUBTOTAL = 'subtotal';

    const DESCUENTO = 'descuento';

    const COSTO_DOMICILIO = 'costo_domicilio';

    const ESTATUS_PEDIDO_ID = 'estatus_pedido_id';

    const SISTEMA_ID = 'sistema_id';

    const FECHA_INICIO = 'fecha_inicio';

    const FECHA_FINAL = 'fecha_final';

    const TENANT_ID = 'tenant_id';

    const IS_DELIVERY = 'is_delivery';

    const DELIVERY_ADDRESS = 'delivery_address';

    const DELIVERY_REFERENCE = 'delivery_reference';

    const PAYMENT_METHOD_ID = 'payment_method_id';

    const PROPINA = 'propina';

    const CUSTOMER_ID = 'customer_id';

    const IS_CREDIT = 'is_credit';

    const CREDIT_APPLIED_AT = 'credit_applied_at';

    protected $casts = [
        self::IS_CREDIT => 'boolean',
    ];

    public static $ALLOWED_UPDATE = [
        self::DESCUENTO,
        self::NOMBRE_PEDIDO,
        self::ESTATUS_PEDIDO_ID,
        self::PAYMENT_METHOD_ID,
        self::PROPINA,
    ];

    protected $fillable = [
        self::TOTAL,
        self::SUBTOTAL,
        self::DESCUENTO,
        self::COSTO_DOMICILIO,
        self::PROPINA,
        self::NOMBRE_PEDIDO,
        self::ESTATUS_PEDIDO_ID,
        self::SISTEMA_ID,
        self::TENANT_ID,
        self::IS_DELIVERY,
        self::DELIVERY_ADDRESS,
        self::DELIVERY_REFERENCE,
        self::PAYMENT_METHOD_ID,
        self::CUSTOMER_ID,
        self::IS_CREDIT,
    ];

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethodModel::class, self::PAYMENT_METHOD_ID);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(CustomerModel::class, self::CUSTOMER_ID);
    }

    public function sistema(): BelongsTo
    {
        return $this->belongsTo(MainOrderReportModel::class, self::SISTEMA_ID);
    }

    public function orderProducts(): HasMany
    {
        return $this->hasMany(OrderProductModel::class, 'pedido_id')
            ->where(function ($query) {
                $query->whereHas('product')
                    ->orWhereNotNull('nombre_extra');
            })
            ->with(['product', 'variant']);
    }

    public function status(): HasOne
    {
        return $this->hasOne(OrderStatusModel::class, 'id', 'estatus_pedido_id');
    }

    public function totalAndSubTotalOrder()
    {
        $orderDiscount = $this->descuento ?? 0;
        $orderSubtotal = $this->totalOrderProducts();
        if (! $this->descuento) {
            $orderTotal = $orderSubtotal;
        } else {
            $discount = $orderSubtotal * ($orderDiscount / 100);
            $orderTotal = $orderSubtotal - $discount;
        }

        return [
            'total' => $orderTotal,
            'subtotal' => $orderSubtotal,
        ];
    }

    public function totalOrderProducts(): float
    {
        return (float) DB::table('order_product')
            ->where('pedido_id', $this->id)
            ->where(function ($q) {
                $q->whereNotNull('producto_id')->orWhereNotNull('nombre_extra');
            })
            ->selectRaw('ROUND(SUM(precio * cantidad * (1 - COALESCE(descuento, 0) / 100.0)), 2) as total')
            ->value('total') ?? 0.0;
    }

    public static function hasActiveOrders(MainOrderReportModel $system): int
    {
        return static::where('sistema_id', $system->id)
            ->whereIn('estatus_pedido_id', [
                OrderStatusEnum::IN_PROCESS->value,
                OrderStatusEnum::SERVED->value,
                OrderStatusEnum::PENDING_CONFIRMATION->value,
            ])
            ->whereNull('deleted_at')
            ->count();
    }

    /**
     * averageTicket — ingresos totales y ticket promedio de las ventas cerradas en el rango
     * dado. A diferencia de sumar cantidades (kg + piezas no son comparables), el monto en
     * pesos sí es una métrica coherente sin importar la mezcla de unidades del catálogo.
     */
    public static function averageTicket(?Carbon $start = null, ?Carbon $end = null, ?int $sistemaId = null): array
    {
        $query = static::where(self::ESTATUS_PEDIDO_ID, OrderStatusEnum::CLOSED->value);

        if ($start && $end) {
            $query->whereBetween('created_at', [$start, $end]);
        }

        if ($sistemaId) {
            $query->where(self::SISTEMA_ID, $sistemaId);
        }

        $totalRevenue = (float) round($query->sum(self::TOTAL), 2);
        $ordersCount = (clone $query)->count();

        return [
            'total_revenue' => $totalRevenue,
            'orders_count' => $ordersCount,
            'average_ticket' => $ordersCount > 0 ? round($totalRevenue / $ordersCount, 2) : 0,
        ];
    }
}
