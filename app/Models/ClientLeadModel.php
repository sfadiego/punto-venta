<?php

namespace App\Models;

use App\Enums\BusinessNicheEnum;
use App\Enums\ClientLeadStatusEnum;
use Illuminate\Database\Eloquent\Model;

class ClientLeadModel extends Model
{
    protected $table = 'client_leads';

    const BUSINESS_NAME = 'business_name';

    const EMAIL = 'email';

    const PHONE = 'phone';

    const BUSINESS_NICHE = 'business_niche';

    const STATUS = 'status';

    const NOTES = 'notes';

    protected $fillable = [
        self::BUSINESS_NAME,
        self::EMAIL,
        self::PHONE,
        self::BUSINESS_NICHE,
        self::STATUS,
        self::NOTES,
    ];

    protected $casts = [
        self::BUSINESS_NICHE => BusinessNicheEnum::class,
        self::STATUS => ClientLeadStatusEnum::class,
    ];
}
