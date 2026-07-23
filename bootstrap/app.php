<?php

use App\Enums\HttpErrors;
use App\Http\Middleware\CheckSubscription;
use App\Http\Middleware\ErrorReporting;
use App\Http\Middleware\ResolveTenant;
use App\Http\Middleware\TrackActivity;
use App\Http\Middleware\TransactionMiddleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\SubstituteBindings;
use Illuminate\Support\Facades\Response;
use Illuminate\Validation\ValidationException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->redirectGuestsTo(fn () => null);
        $middleware->appendToGroup('api', TransactionMiddleware::class);
        $middleware->appendToGroup('api', ErrorReporting::class);
        $middleware->alias([
            'check.subscription' => CheckSubscription::class,
            'track.activity' => TrackActivity::class,
        ]);
        // ResolveTenant asigna app('tenant_id'), usado por TenantScope para filtrar modelos
        // tenant-scoped. Debe correr ANTES de SubstituteBindings — de lo contrario, el binding
        // implícito de rutas (ej. {category}, {order}, {customer}) resuelve el modelo sin el
        // scope de tenant aplicado, permitiendo acceso cruzado entre tenants.
        $middleware->prependToPriorityList(
            before: SubstituteBindings::class,
            prepend: ResolveTenant::class,
        );
        $middleware->trustProxies(
            // '*' solo en local: permite probar con túneles (ngrok) que terminan TLS y
            // reenvían por HTTP plano — sin esto, Request::isSecure() da false y Laravel
            // genera URLs de assets en http://, causando "mixed content" en el navegador.
            // En producción no se especifica (null = ningún proxy confiado por defecto).
            at: env('APP_ENV') === 'local' ? '*' : null,
            headers: \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR |
                \Illuminate\Http\Request::HEADER_X_FORWARDED_HOST |
                \Illuminate\Http\Request::HEADER_X_FORWARDED_PORT |
                \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO |
                \Illuminate\Http\Request::HEADER_X_FORWARDED_AWS_ELB,
        );
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
