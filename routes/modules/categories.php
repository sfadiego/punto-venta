<?php

use App\Http\Controllers\CategoriesController;
use Illuminate\Support\Facades\Route;

Route::prefix('category')->group(function () {
    Route::controller(CategoriesController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/list', 'list');
        Route::prefix('{category}')->group(function () {
            Route::get('', 'show');
            Route::get('product', 'categoryProduct');
        });

        Route::middleware('role.admin')->group(function () {
            Route::post('', 'store');
            Route::prefix('{category}')->group(function () {
                Route::put('', 'update');
                Route::delete('', 'delete');
            });
        });
    });
});
