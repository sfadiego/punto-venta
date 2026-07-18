<?php

namespace App\Models;

use App\Enums\OrderStatusEnum;
use App\Models\Traits\HasTenant;
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

    const CUSTOMER_PHONE = 'customer_phone';

    const IS_DELIVERY = 'is_delivery';

    const DELIVERY_ADDRESS = 'delivery_address';

    const DELIVERY_REFERENCE = 'delivery_reference';

    const PAYMENT_METHOD_ID = 'payment_method_id';

    const PROPINA = 'propina';

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
        self::CUSTOMER_PHONE,
        self::IS_DELIVERY,
        self::DELIVERY_ADDRESS,
        self::DELIVERY_REFERENCE,
        self::PAYMENT_METHOD_ID,
    ];

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethodModel::class, self::PAYMENT_METHOD_ID);
    }

    public function orderProducts(): HasMany
    {
        return $this->hasMany(OrderProductModel::class, 'pedido_id')
            ->where(function ($query) {
                $query->whereHas('product')
                    ->orWhereNotNull('nombre_extra');
            })
            ->with('product');
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
}
