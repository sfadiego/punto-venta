<?php

namespace App\Models;

use App\Enums\StockMovementReasonEnum;
use App\Enums\StockMovementTypeEnum;
use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StockMovementModel extends Model
{
    use HasFactory, HasTenant;

    protected $table = 'stock_movements';

    const PRODUCT_ID = 'product_id';

    const VARIANT_ID = 'variant_id';

    const TYPE = 'type';

    const QUANTITY = 'quantity';

    const STOCK_BEFORE = 'stock_before';

    const STOCK_AFTER = 'stock_after';

    const REASON = 'reason';

    const CREATED_BY = 'created_by';

    const NOTE = 'note';

    const TENANT_ID = 'tenant_id';

    protected $casts = [
        self::TYPE => StockMovementTypeEnum::class,
        self::REASON => StockMovementReasonEnum::class,
        self::QUANTITY => 'decimal:2',
        self::STOCK_BEFORE => 'decimal:2',
        self::STOCK_AFTER => 'decimal:2',
    ];

    protected $fillable = [
        self::PRODUCT_ID,
        self::VARIANT_ID,
        self::TYPE,
        self::QUANTITY,
        self::STOCK_BEFORE,
        self::STOCK_AFTER,
        self::REASON,
        self::CREATED_BY,
        self::NOTE,
        self::TENANT_ID,
        'reference_type',
        'reference_id',
    ];

    public function product(): BelongsTo
    {
        return $this->belongsTo(ProductModel::class, self::PRODUCT_ID, 'id');
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariantModel::class, self::VARIANT_ID, 'id');
    }

    public function reference(): MorphTo
    {
        return $this->morphTo();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, self::CREATED_BY, 'id');
    }
}
