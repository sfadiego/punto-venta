<?php

use App\Enums\HttpErrors;
use App\Http\Middleware\CheckSubscription;
use App\Http\Middleware\ErrorReporting;
use App\Http\Middleware\TrackActivity;
use App\Http\Middleware\TransactionMiddleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        channels: __DIR__ . '/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->redirectGuestsTo(fn() => null);
        $middleware->appendToGroup('api', TransactionMiddleware::class);
        $middleware->appendToGroup('api', ErrorReporting::class);
        $middleware->alias([
            'check.subscription' => CheckSubscription::class,
            'track.activity' => TrackActivity::class,
        ]);
        $middleware->trustProxies(headers: \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR |
            \Illuminate\Http\Request::HEADER_X_FORWARDED_HOST |
            \Illuminate\Http\Request::HEADER_X_FORWARDED_PORT |
            \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO |
            \Illuminate\Http\Request::HEADER_X_FORWARDED_AWS_ELB);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            return Response::json(['message' => 'Unauthenticated.'], 401);
        });
        $exceptions->render(function (ValidationException $e) {
            return Response::json([
                'success' => false,
                'data' => $e->errors(),
            ], HttpErrors::BadRequest->value);
        });
    })->create();
