<?php

use App\Http\Controllers\ProvidersController;
use Illuminate\Support\Facades\Route;

Route::prefix('provider')->group(function () {
    Route::controller(ProvidersController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/list', 'list');

        Route::middleware('role.admin')->group(function () {
            Route::post('', 'store');

            Route::prefix('{provider}')->group(function () {
                Route::get('', 'show');
                Route::put('', 'update');
                Route::delete('', 'delete');
                Route::patch('toggle-active', 'toggleActive');
                Route::get('purchase', 'purchases');
                Route::post('purchase', 'storePurchase');
            });
        });
    });
});
