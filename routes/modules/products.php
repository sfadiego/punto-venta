<?php

use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductImageController;
use App\Http\Controllers\ProductImportController;
use App\Http\Controllers\ProductVariantController;
use Illuminate\Support\Facades\Route;

// El frontend gatea toda la página /products (listar, crear, editar, borrar, reabastecer,
// variantes) con un solo permiso viewProducts — todavía no distingue "ver" de "administrar".
// Este middleware cierra el acceso directo al backend sin el permiso, sin cambiar nada para
// quien ya lo tiene (Employe lo trae por default).
Route::prefix('product')->group(function () {
    Route::middleware('permission:viewProducts')->group(function () {
        Route::controller(ProductController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('{product}', 'show');
            Route::post('', 'store');
            Route::put('{product}', 'update');
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

    // Reajuste manual de stock — compartido entre el flujo clásico de Productos (viewProducts,
    // venta_por_peso/restaurante) y el módulo de Inventario retail (manageStock). Ver CLAUDE.md
    // "permission:xxx,yyy": dos flujos de UI legítimos que llegan al mismo endpoint.
    Route::middleware('permission:viewProducts,manageStock')
        ->post('{product}/stock-adjustment', [ProductController::class, 'stockAdjustment']);

    // Importación masiva de productos (CSV) — módulo de Inventario, exclusivo de negocios
    // retail (ver RetailStockMiddleware). Prefijo /import antes del grupo {product} para no
    // colisionar con el route-model-binding de show/update/delete.
    Route::middleware(['permission:manageStock', 'retail.stock'])->prefix('import')->group(function () {
        Route::controller(ProductImportController::class)->group(function () {
            Route::post('preview', 'preview');
            Route::post('commit', 'commit');
            Route::get('template', 'template');
        });
    });
});
