<?php

namespace App\Models;

use App\Http\Middleware\TrackActivity;
use Illuminate\Database\Eloquent\Builder;
use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    const TENANT_ID = 'tenant_id';

    const LAST_USED_AT = 'last_used_at';

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
            ->where(self::LAST_USED_AT, '>=', now()->subMinutes(TrackActivity::activeWindowMinutes()));
    }
}
