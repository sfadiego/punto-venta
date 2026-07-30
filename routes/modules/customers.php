<?php

use App\Http\Controllers\CustomersController;
use Illuminate\Support\Facades\Route;

Route::prefix('customer')->group(function () {
    Route::controller(CustomersController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/list', 'list');
        // store queda abierto: alta inline de cliente desde el picker de venta a
        // crédito (SellByWeightSaleModal), accesible a todos los roles en Dashboard.
        Route::post('', 'store');
        Route::prefix('{customer}')->group(function () {
            Route::get('', 'show');

            Route::middleware('role.admin')->group(function () {
                Route::put('', 'update');
                Route::delete('', 'delete');
                Route::patch('toggle-credit', 'toggleCredit');
                Route::post('payment', 'registerPayment');
            });
        });
    });
});
