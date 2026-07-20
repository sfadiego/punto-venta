<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CustomerModel extends Model
{
    use HasFactory, HasTenant, SoftDeletes;

    protected $table = 'customers';

    const NAME = 'name';

    const PHONE = 'phone';

    const NOTES = 'notes';

    const ALLOW_CREDIT = 'allow_credit';

    const BALANCE = 'balance';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::NAME,
        self::PHONE,
        self::NOTES,
        self::ALLOW_CREDIT,
        self::BALANCE,
        self::TENANT_ID,
    ];

    protected $casts = [
        self::ALLOW_CREDIT => 'boolean',
        self::BALANCE => 'decimal:2',
    ];

    public function creditOrders(): HasMany
    {
        return $this->hasMany(OrderModel::class, 'customer_id')
            ->where('is_credit', true)
            ->orderByDesc('created_at');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(CustomerPaymentModel::class, 'customer_id')
            ->orderByDesc('created_at');
    }
}
