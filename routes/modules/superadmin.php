<?php

use App\Http\Controllers\ClientErrorController;
use App\Http\Controllers\SuperAdmin\AppSettingController;
use App\Http\Controllers\SuperAdmin\SubscriptionController;
use App\Http\Controllers\SuperAdmin\SuperAdminAuthController;
use App\Http\Controllers\SuperAdmin\TenantManagementController;
use App\Http\Controllers\SuperAdmin\TenantUserController;
use App\Http\Middleware\SuperAdminMiddleware;
use Illuminate\Support\Facades\Route;

Route::prefix('super-admin')->group(function () {
    Route::post('auth/login', [SuperAdminAuthController::class, 'login']);

    Route::middleware(['auth:sanctum', SuperAdminMiddleware::class])->group(function () {
        Route::get('error-logs', [ClientErrorController::class, 'index']);

        Route::prefix('settings')->controller(AppSettingController::class)->group(function () {
            Route::get('', 'show');
            Route::put('', 'update');
        });

        Route::prefix('subscription')->controller(SubscriptionController::class)->group(function () {
            Route::get('', 'index');
            Route::post('{tenant}', 'store');
            Route::get('{tenant}/history', 'history');
        });

        Route::prefix('tenant')->controller(TenantManagementController::class)->group(function () {
            Route::get('/', 'index');
            Route::post('', 'store');
            Route::prefix('{tenant}')->group(function () {
                Route::get('', 'show');
                Route::put('', 'update');
                Route::patch('toggle', 'toggle');
                Route::patch('restore', 'restore');
                Route::delete('', 'delete');
                Route::delete('demo-data', 'clearDemoData');
            });

            Route::prefix('{tenant}/users')->controller(TenantUserController::class)->group(function () {
                Route::get('', 'index');
                Route::post('', 'store');
                Route::post('seed', 'seedUsers');
                Route::put('{user}', 'update');
                Route::delete('{user}', 'delete');
            });
        });
    });
});
