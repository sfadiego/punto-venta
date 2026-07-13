<?php

use App\Http\Controllers\Admin\BusinessConfigController;
use App\Http\Controllers\Admin\MainOrderReportController;
use App\Http\Controllers\Admin\StatisticsController;
use App\Http\Controllers\PaymentMethodController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->group(function () {
    Route::prefix('payment-methods')->controller(PaymentMethodController::class)->group(function () {
        Route::get('/', 'index');
        Route::post('/', 'store');
        Route::put('{paymentMethod}', 'update');
        Route::delete('{paymentMethod}', 'delete');
    });

    Route::prefix('users')->group(function () {
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

        Route::prefix('statistics')->group(function () {
            Route::controller(StatisticsController::class)->group(function () {
                Route::get('best-seller', 'top3BestSeller');
            });
        });
    });

    Route::prefix('config')->group(function () {
        Route::controller(BusinessConfigController::class)->group(function () {
            Route::get('', 'show');
            Route::put('', 'update');
            Route::post('logo', 'uploadLogo');
            Route::delete('logo', 'removeLogo');
            Route::get('subscription-status', 'subscriptionStatus');
        });
    });
});
