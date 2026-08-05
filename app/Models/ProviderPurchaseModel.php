<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderPurchaseModel extends Model
{
    use HasFactory, HasTenant;

    protected $table = 'provider_purchases';

    const PROVIDER_ID = 'provider_id';

    const AMOUNT = 'amount';

    const CREATED_BY = 'created_by';

    const NOTE = 'note';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::PROVIDER_ID,
        self::AMOUNT,
        self::CREATED_BY,
        self::NOTE,
        self::TENANT_ID,
    ];

    protected $casts = [
        self::AMOUNT => 'decimal:2',
    ];

    public function provider(): BelongsTo
    {
        return $this->belongsTo(ProviderModel::class, self::PROVIDER_ID);
    }
}
