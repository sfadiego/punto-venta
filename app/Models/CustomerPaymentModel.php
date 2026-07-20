<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerPaymentModel extends Model
{
    use HasFactory, HasTenant;

    protected $table = 'customer_payments';

    const CUSTOMER_ID = 'customer_id';

    const AMOUNT = 'amount';

    const CREATED_BY = 'created_by';

    const NOTE = 'note';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::CUSTOMER_ID,
        self::AMOUNT,
        self::CREATED_BY,
        self::NOTE,
        self::TENANT_ID,
    ];

    protected $casts = [
        self::AMOUNT => 'decimal:2',
    ];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(CustomerModel::class, self::CUSTOMER_ID);
    }
}
