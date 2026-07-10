<?php

namespace App\Http\Middleware;

use App\Enums\SubscriptionStatusEnum;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    private const ALLOWED_PATHS = [
        'api/admin/config/subscription-status',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->tenant) {
            return $next($request);
        }

        foreach (self::ALLOWED_PATHS as $path) {
            if ($request->is($path)) {
                return $next($request);
            }
        }

        $status = $user->tenant->subscription_status;

        if ($status === SubscriptionStatusEnum::Expired->value || $status === SubscriptionStatusEnum::Pending->value) {
            return response()->json([
                'success' => false,
                'message' => 'Tu suscripción no está activa. Revisa el estado de tu plan o contacta al administrador.',
                'code' => 'SUBSCRIPTION_EXPIRED',
            ], 403);
        }

        return $next($request);
    }
}
