<?php

use App\Http\Controllers\AddonController;
use Illuminate\Support\Facades\Route;

// Catálogo de complementos (toppings/extras). Lectura abierta a quien toma pedidos o
// administra productos (el selector de venta y el checklist del formulario de producto);
// escritura exclusiva del Admin, igual que categorías. Todo el catálogo es exclusivo de negocios
// restaurante/cafetería (restaurant.addons).
Route::prefix('addon')->middleware('restaurant.addons')->group(function () {
    Route::controller(AddonController::class)->group(function () {
        Route::middleware('permission:takeOrder,viewOrders,viewProducts')->group(function () {
            Route::get('/', 'index');
            Route::get('/list', 'list');
            Route::get('{addon}', 'show');
        });

        Route::middleware('role.admin')->group(function () {
            Route::post('', 'store');
            Route::put('{addon}', 'update');
            Route::put('{addon}/products', 'syncProducts');
            Route::delete('{addon}', 'delete');
        });
    });
});
