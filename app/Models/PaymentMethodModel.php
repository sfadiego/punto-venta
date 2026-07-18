<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentMethodModel extends Model
{
    protected $table = 'payment_methods';

    const NAME = 'name';

    const ACTIVE = 'active';

    protected $fillable = [
        self::NAME,
        self::ACTIVE,
    ];

    protected $casts = [
        self::ACTIVE => 'boolean',
    ];
}
