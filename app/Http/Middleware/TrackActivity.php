<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * users.last_seen_at ya no se usa para el conteo de "usuarios activos" —
 * ver App\Models\PersonalAccessToken::scopeActiveForTenant(), que cuenta
 * sesiones (tokens) reales en vez de cuentas de usuario únicas.
 */
class TrackActivity
{
    private const TTL_SECONDS = 60;

    private const ACTIVE_WINDOW_MINUTES = 15;

    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user && $user->tenant_id) {
            $cacheKey = "user_last_seen_{$user->id}";

            if (! Cache::has($cacheKey)) {
                $user->updateQuietly([User::LAST_SEEN_AT => now()]);
                Cache::put($cacheKey, true, self::TTL_SECONDS);
            }
        }

        return $next($request);
    }

    public static function activeWindowMinutes(): int
    {
        return self::ACTIVE_WINDOW_MINUTES;
    }
}
