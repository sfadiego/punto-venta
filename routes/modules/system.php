<?php

use App\Http\Controllers\Admin\BusinessConfigController;
use App\Http\Controllers\Admin\ExpensesController;
use App\Http\Controllers\Admin\MainOrderReportController;
use App\Http\Controllers\Admin\RolePermissionController;
use App\Http\Controllers\Admin\StatisticsController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->group(function () {
    Route::prefix('payment-methods')->middleware('role.admin')->controller(PaymentMethodController::class)->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::put('{paymentMethod}', 'update');
        Route::delete('{paymentMethod}', 'delete');
    });

    Route::prefix('users')->middleware('role.admin')->group(function () {
        Route::controller(UserController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('{user}', 'show');
            Route::put('{user}', 'update');
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

        Route::prefix('statistics')->middleware('role.admin')->group(function () {
            Route::controller(StatisticsController::class)->group(function () {
                Route::get('best-seller', 'top3BestSeller');
            });
        });
    });

    Route::prefix('role-permissions')->middleware('role.admin')->controller(RolePermissionController::class)->group(function () {
        Route::get('/', 'index');
        Route::put('{role}', 'update');
    });

    Route::prefix('config')->controller(BusinessConfigController::class)->group(function () {
        // Visible en el Dashboard para todos los roles (SubscriptionBanner)
        Route::get('subscription-status', 'subscriptionStatus');

        Route::middleware('role.admin')->group(function () {
            Route::get('', 'show');
            Route::put('', 'update');
            Route::post('logo', 'uploadLogo');
            Route::delete('logo', 'removeLogo');
        });
    });
});
