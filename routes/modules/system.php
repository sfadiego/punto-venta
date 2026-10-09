<?php

use App\Http\Controllers\Admin\BusinessConfigController;
use App\Http\Controllers\Admin\ExpensesController;
use App\Http\Controllers\Admin\MainOrderReportController;
use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\SlowMovingProductsController;
use App\Http\Controllers\Admin\StatisticsController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->group(function () {
    Route::prefix('payment-methods')->controller(PaymentMethodController::class)->group(function () {
        // Lectura abierta a todos: se usa al cobrar/pagar una orden (cualquier rol con
        // permiso payOrder necesita ver los métodos de pago disponibles).
        Route::get('/', 'index');

        Route::middleware('role.admin')->group(function () {
            Route::post('/', 'store');
            Route::put('{paymentMethod}', 'update');
            Route::delete('{paymentMethod}', 'delete');
        });
    });

    Route::prefix('users')->controller(UserController::class)->group(function () {
        // Lectura: accesible si el rol tiene "viewUsers" otorgado (Admin siempre pasa).
        // Escritura (crear/editar): exclusiva de Admin — "viewUsers" solo da visibilidad.
        Route::middleware('permission:viewUsers')->group(function () {
            Route::get('/', 'index');
            Route::get('{user}', 'show');
            Route::get('{user}/branches', 'branches');
        });

        Route::middleware('role.admin')->group(function () {
            Route::post('/', 'store');
            Route::put('{user}', 'update');
            Route::put('{user}/branches', 'syncBranches');
        });
    });

    Route::prefix('system')->group(function () {
        Route::controller(MainOrderReportController::class)->group(function () {
            Route::get('active-sale', 'getActiveSale');
            Route::post('open', 'openSales');
            Route::prefix('{system}')->group(function () {
                Route::get('', 'show');
                Route::get('total-current-sales', 'totalCurrentSales');
                Route::post('close', 'closeSales');
            });
        });

        Route::prefix('{system}/expense')->controller(ExpensesController::class)->group(function () {
            Route::get('', 'index');
            Route::post('', 'store');
        });

        Route::prefix('statistics')->group(function () {
            // best-seller es de lectura abierta: el Dashboard lo consume para todos los
            // roles (useDashboard.ts), no solo desde la página de Estadísticas (Admin-only).
            Route::controller(StatisticsController::class)->group(function () {
                Route::get('best-seller', 'top3BestSeller');
                Route::get('average-ticket', 'averageTicket');
            });

            // Clientes con más adeudo (retail y venta por peso): exige viewStatistics, y el tipo de negocio
            // se valida en el controlador.
            Route::middleware('permission:viewStatistics')->group(function () {
                Route::get('top-debtors', [StatisticsController::class, 'topDebtors']);
                // throttle: 10 descargas por minuto — corta un loop accidental, no el uso normal.
                Route::middleware('throttle:10,1')->get('top-debtors/export', [StatisticsController::class, 'exportTopDebtors']);
            });

            // Productos con mucho tiempo sin movimiento (retail con stock activo) — la página de
            // Estadísticas es la única consumidora, así que exige viewStatistics además del tipo
            // de negocio (retail.stock).
            Route::middleware(['permission:viewStatistics', 'retail.stock'])
                ->prefix('slow-moving')
                ->controller(SlowMovingProductsController::class)
                ->group(function () {
                    Route::get('summary', 'summary');
                    Route::middleware('throttle:10,1')->get('export', 'export');
                    Route::get('', 'index');
                });
        });
    });

    Route::prefix('role-permissions')->controller(RolePermissionController::class)->group(function () {
        // Lectura: accesible si el rol tiene "viewAdmin" otorgado (ve qué puede hacer
        // cada rol, sin poder cambiarlo). Escritura sigue exclusiva de Admin.
        Route::middleware('permission:viewAdmin')->group(function () {
            Route::get('/', 'index');
        });

        Route::middleware('role.admin')->group(function () {
            Route::put('{role}', 'update');
        });
    });

    Route::prefix('config')->controller(BusinessConfigController::class)->group(function () {
        // Lectura abierta a todos los roles: colores/branding (sidebar, layout completo),
        // impresora, domicilio default, etc. se consumen en toda la app, no solo en el
        // panel de administración. Visible también el estado de suscripción (SubscriptionBanner).
        Route::get('', 'show');
        Route::get('subscription-status', 'subscriptionStatus');

        Route::middleware('role.admin')->group(function () {
            Route::put('', 'update');
            Route::post('logo', 'uploadLogo');
            Route::delete('logo', 'removeLogo');
        });
    });
});
