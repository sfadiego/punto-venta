<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    const TENANT_ID = 'tenant_id';

    const LAST_USED_AT = 'last_used_at';

    private const ACTIVE_WINDOW_MINUTES = 15;

    protected $fillable = [
        'name',
        'token',
        'abilities',
        'expires_at',
        self::TENANT_ID,
    ];

    public function scopeActiveForTenant(Builder $query, int $tenantId): Builder
    {
        return $query
            ->where(self::TENANT_ID, $tenantId)
            ->where(self::LAST_USED_AT, '>=', now()->subMinutes(self::activeWindowMinutes()));
    }

    public static function activeWindowMinutes(): int
    {
        return self::ACTIVE_WINDOW_MINUTES;
    }
}
