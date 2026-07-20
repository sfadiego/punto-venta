<?php

use App\Http\Controllers\CustomersController;
use Illuminate\Support\Facades\Route;

Route::prefix('customer')->group(function () {
    Route::controller(CustomersController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/list', 'list');
        Route::post('', 'store');
        Route::prefix('{customer}')->group(function () {
            Route::get('', 'show');
            Route::put('', 'update');
            Route::delete('', 'delete');
            Route::patch('toggle-credit', 'toggleCredit');
            Route::post('payment', 'registerPayment');
        });
    });
});
