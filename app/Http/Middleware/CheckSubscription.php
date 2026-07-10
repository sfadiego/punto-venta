<?php

namespace App\Http\Middleware;

use App\Enums\SubscriptionStatusEnum;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckSubscription
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->tenant) {
            return $next($request);
        }

        $status = $user->tenant->subscription_status;

        if ($status === SubscriptionStatusEnum::Expired->value || $status === SubscriptionStatusEnum::Pending->value) {
            return response()->json([
                'success' => false,
                'message' => 'Suscripción inactiva. Contacta al administrador.',
                'code' => 'SUBSCRIPTION_EXPIRED',
            ], 403);
        }

        return $next($request);
    }
}
