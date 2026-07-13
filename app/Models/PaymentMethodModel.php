<?php

namespace App\Models;

use App\Models\Traits\HasTenant;
use Illuminate\Database\Eloquent\Model;

class PaymentMethodModel extends Model
{
    use HasTenant;

    protected $table = 'payment_methods';

    const NAME = 'name';

    const ACTIVE = 'active';

    const TENANT_ID = 'tenant_id';

    protected $fillable = [
        self::NAME,
        self::ACTIVE,
        self::TENANT_ID,
    ];

    protected $casts = [
        self::ACTIVE => 'boolean',
    ];
}
