<?php

use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderProductController;
use App\Http\Controllers\PrintController;
use Illuminate\Support\Facades\Route;

Route::prefix('order')->group(function () {
    Route::controller(OrderController::class)->group(function () {
        Route::get('/', 'index');
        Route::middleware('permission:takeOrder')->post('/', 'store');
        Route::middleware('permission:viewOrders')->post('/sale', 'storeSale');

        Route::middleware('permission:viewSales')->group(function () {
            Route::get('/sales-by-category', 'salesByCategory');
            Route::get('/sales-report/export', 'exportSalesReport');
        });

        Route::middleware('permission:viewCloseSales')->get('/credit-customers', 'creditCustomers');

        Route::middleware('permission:printTicket')->get('/print/test-bytes', [PrintController::class, 'testBytes']);

        Route::prefix('{order}')->group(function () {
            Route::get('', 'show');
            Route::get('total', 'total');
            // update() atiende 3 intenciones distintas (renombrar/cerrar-cobrar/marcar
            // servida), cada una con su propio permiso — se valida por campo dentro de
            // OrderCloseService, no aquí (un solo permission:xxx sería incorrecto).
            Route::put('', 'update');
            Route::middleware('permission:deleteOrder')->delete('', 'delete');
            Route::middleware('permission:printTicket')->prefix('print')->group(base_path('routes/modules/printer.php'));

            Route::prefix('product')->group(function () {
                Route::controller(OrderProductController::class)->group(function () {
                    Route::get('', 'index');
                    Route::get('{product}', 'show');

                    // takeOrder cubre TakeOrderPage (Restaurante/Retail); viewOrders cubre
                    // QuickSale retomando una orden en proceso (Caja no tiene takeOrder por
                    // default, pero sí necesita editar el carrito al retomar una venta).
                    Route::middleware('permission:takeOrder,viewOrders')->group(function () {
                        Route::post('', 'store');
                        Route::put('{product}', 'update');
                        Route::put('{item}/note', 'updateNote');
                        Route::delete('{product}', 'delete');
                    });

                    // Única vía que usa Cocina para marcar un platillo listo — no debe
                    // exigir takeOrder (Cocina no lo tiene por default).
                    Route::middleware('permission:kitchenView')->patch('{item}/ready', 'toggleReady');
                });
            });

            Route::middleware('permission:takeOrder,viewOrders')->group(function () {
                Route::prefix('extra')->group(function () {
                    Route::controller(OrderProductController::class)->group(function () {
                        Route::delete('{extra}', 'deleteExtra');
                    });
                });

                Route::delete('clear-cart', [OrderProductController::class, 'clearCart']);
            });
        });
    });
});
