<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

class LoginRateLimitService
{
    private const REGISTRY_TTL_MINUTES = 5;

    public function registerBlock(string $email, string $ip): void
    {
        $key = $this->registryKey($email);
        $ips = Cache::get($key, []);

        Cache::put($key, array_values(array_unique([...$ips, $ip])), now()->addMinutes(self::REGISTRY_TTL_MINUTES));
    }

    /**
     * @return array<int, array{ip: string, attempts: int, retry_after: int}>
     */
    public function blockedIpsFor(string $email): array
    {
        $ips = Cache::get($this->registryKey($email), []);
        $blocked = [];

        foreach ($ips as $ip) {
            $limiterKey = $this->limiterKey($email, $ip);
            $attempts = RateLimiter::attempts($limiterKey);

            if ($attempts > 0) {
                $blocked[] = [
                    'ip' => $ip,
                    'attempts' => $attempts,
                    'retry_after' => RateLimiter::availableIn($limiterKey),
                ];
            }
        }

        return $blocked;
    }

    public function unblock(string $email): int
    {
        $key = $this->registryKey($email);
        $ips = Cache::get($key, []);
        $cleared = 0;

        foreach ($ips as $ip) {
            $limiterKey = $this->limiterKey($email, $ip);

            if (RateLimiter::attempts($limiterKey) > 0) {
                RateLimiter::clear($limiterKey);
                $cleared++;
            }
        }

        Cache::forget($key);

        return $cleared;
    }

    private function registryKey(string $email): string
    {
        return 'login_blocked_ips:'.strtolower($email);
    }

    private function limiterKey(string $email, string $ip): string
    {
        // Debe coincidir con el hashing interno de Illuminate\Routing\Middleware\ThrottleRequests
        // para el limiter 'login' definido en AppServiceProvider::configureRateLimiting()
        return md5('login'.strtolower($email).'|'.$ip);
    }
}
