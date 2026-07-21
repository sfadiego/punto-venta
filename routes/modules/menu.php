<?php

use App\Http\Controllers\MenuController;
use Illuminate\Support\Facades\Route;

// Rutas públicas — sin autenticación
Route::prefix('menu/{slug}')->controller(MenuController::class)->group(function () {
    Route::get('', 'show');
    Route::get('products', 'products');
    Route::get('customer', 'customerLookup');
    Route::post('order', 'store');
});
