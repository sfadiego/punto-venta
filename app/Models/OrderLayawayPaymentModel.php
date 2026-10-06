<?php

namespace App\Models;

use App\Enums\LayawayPaymentTypeEnum;
use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderLayawayPaymentModel extends Model
{
    use HasFactory, HasTenant;

    protected $table = 'order_layaway_payments';

    const ORDER_ID = 'order_id';

    const CUSTOMER_ID = 'customer_id';

    const TYPE = 'type';

    const AMOUNT = 'amount';

    const PAYMENT_METHOD_ID = 'payment_method_id';

    const SISTEMA_ID = 'sistema_id';

    const CREATED_BY = 'created_by';

    const NOTE = 'note';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::ORDER_ID,
        self::CUSTOMER_ID,
        self::TYPE,
        self::AMOUNT,
        self::PAYMENT_METHOD_ID,
        self::SISTEMA_ID,
        self::CREATED_BY,
        self::NOTE,
        self::TENANT_ID,
    ];

    // float (no decimal:2) — este modelo se serializa directo en la API y un cast decimal
    // llegaría al frontend como string.
    protected $casts = [
        self::TYPE => LayawayPaymentTypeEnum::class,
        self::AMOUNT => 'float',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(OrderModel::class, self::ORDER_ID);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(CustomerModel::class, self::CUSTOMER_ID);
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethodModel::class, self::PAYMENT_METHOD_ID);
    }
}
