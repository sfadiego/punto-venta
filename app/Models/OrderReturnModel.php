<?php

namespace App\Models;

use App\Enums\ReturnReasonEnum;
use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderReturnModel extends Model
{
    use HasFactory, HasTenant;

    protected $table = 'order_returns';

    const ORDER_ID = 'order_id';

    const REASON = 'reason';

    const NOTE = 'note';

    const REFUND_AMOUNT = 'refund_amount';

    const BALANCE_APPLIED = 'balance_applied';

    const REFUND_PAYMENT_METHOD_ID = 'refund_payment_method_id';

    const SISTEMA_ID = 'sistema_id';

    const CREATED_BY = 'created_by';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::ORDER_ID,
        self::REASON,
        self::NOTE,
        self::REFUND_AMOUNT,
        self::BALANCE_APPLIED,
        self::REFUND_PAYMENT_METHOD_ID,
        self::SISTEMA_ID,
        self::CREATED_BY,
        self::TENANT_ID,
    ];

    // float (no decimal:2) — se serializa directo en la API y un cast decimal llegaría como string.
    protected $casts = [
        self::REASON => ReturnReasonEnum::class,
        self::REFUND_AMOUNT => 'float',
        self::BALANCE_APPLIED => 'float',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(OrderModel::class, self::ORDER_ID);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderReturnItemModel::class, OrderReturnItemModel::ORDER_RETURN_ID);
    }

    public function refundPaymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethodModel::class, self::REFUND_PAYMENT_METHOD_ID);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, self::CREATED_BY);
    }
}
