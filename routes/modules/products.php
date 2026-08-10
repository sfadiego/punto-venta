<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductImageController;
use App\Http\Controllers\ProductVariantController;
use Illuminate\Support\Facades\Route;

Route::prefix('product')->group(function () {
    Route::controller(ProductController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('{product}', 'show');
        Route::post('', 'store');
        Route::put('{product}', 'update');
        Route::post('{product}/stock-adjustment', 'stockAdjustment');
        Route::get('{product}/stock-movements', 'stockMovements');
        Route::delete('{product}', 'delete');
    });

    Route::prefix('{product}/image')->group(function () {
        Route::controller(ProductImageController::class)->group(function () {
            Route::post('', 'store');
            Route::post('{image}', 'update');
        });
    });

    Route::prefix('{product}/variant')->group(function () {
        Route::controller(ProductVariantController::class)->group(function () {
            Route::get('', 'index');
            Route::post('', 'store');
            Route::put('{variant}', 'update');
            Route::delete('{variant}', 'delete');
        });
    });
});
