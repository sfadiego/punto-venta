<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeatureSpotlightSeen extends Model
{
    protected $table = 'feature_spotlights_seen';

    const USER_ID = 'user_id';

    const TENANT_ID = 'tenant_id';

    const FEATURE_KEY = 'feature_key';

    const SEEN_AT = 'seen_at';

    protected $fillable = [
        self::USER_ID,
        self::TENANT_ID,
        self::FEATURE_KEY,
        self::SEEN_AT,
    ];

    protected function casts(): array
    {
        return [
            self::SEEN_AT => 'datetime',
        ];
    }
}
