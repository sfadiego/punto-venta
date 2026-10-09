<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderReturnItemModel extends Model
{
    use HasFactory, HasTenant;

    protected $table = 'order_return_items';

    const ORDER_RETURN_ID = 'order_return_id';

    const ORDER_PRODUCT_ID = 'order_product_id';

    const QUANTITY = 'quantity';

    const REFUND_AMOUNT = 'refund_amount';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::ORDER_RETURN_ID,
        self::ORDER_PRODUCT_ID,
        self::QUANTITY,
        self::REFUND_AMOUNT,
        self::TENANT_ID,
    ];

    // float (no decimal:2) — se serializa directo en la API y un cast decimal llegaría como string.
    protected $casts = [
        self::QUANTITY => 'float',
        self::REFUND_AMOUNT => 'float',
    ];

    public function orderReturn(): BelongsTo
    {
        return $this->belongsTo(OrderReturnModel::class, self::ORDER_RETURN_ID);
    }

    public function orderProduct(): BelongsTo
    {
        return $this->belongsTo(OrderProductModel::class, self::ORDER_PRODUCT_ID);
    }
}
