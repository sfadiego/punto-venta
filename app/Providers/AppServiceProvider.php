<?php

namespace App\Providers;

use App\Http\Middleware\ResponseMacros;
use App\Services\LoginRateLimitService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void {}

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResponseMacros::register();

        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        $this->configureRateLimiting();
    }

    private function configureRateLimiting(): void
    {
        // Login: limita por IP + email para no bloquear a todo un local por un solo usuario con password incorrecta
        RateLimiter::for('login', function (Request $request) {
            $email = strtolower((string) $request->input('email'));

            return Limit::perMinute(5)->by("{$email}|{$request->ip()}")
                ->response(function (Request $request) use ($email) {
                    Log::warning('Rate limit: login bloqueado', [
                        'email' => $email,
                        'ip' => $request->ip(),
                    ]);

                    app(LoginRateLimitService::class)->registerBlock($email, $request->ip());

                    return response()->json([
                        'success' => false,
                        'message' => 'Demasiados intentos. Espera un minuto e intenta de nuevo.',
                    ], 429);
                });
        });

        // Registro: limita solo por IP, no hay email confiable aún
        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip())
                ->response(function (Request $request) {
                    Log::warning('Rate limit: registro bloqueado', [
                        'ip' => $request->ip(),
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'Demasiados intentos. Espera un minuto e intenta de nuevo.',
                    ], 429);
                });
        });
    }
}
