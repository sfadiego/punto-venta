<?php

use App\Http\Controllers\CategoriesController;
use Illuminate\Support\Facades\Route;

Route::prefix('category')->group(function () {
    Route::controller(CategoriesController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/list', 'list');
        Route::post('', 'store');
        Route::prefix('{category}')->group(function () {
            Route::get('', 'show');
            Route::put('', 'update');
            Route::delete('', 'delete');
            Route::get('product', 'categoryProduct');
        });
    });
});
