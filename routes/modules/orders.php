<?php

use App\Http\Controllers\LayawayController;
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
            // throttle:10,1 — 10 exportaciones por minuto por usuario. Genera un PDF con
            // DomPDF (pesado en CPU/memoria) sin límite de filas más allá del rango de
            // fechas pedido; el límite es generoso a propósito para no afectar el uso normal
            // (nadie exporta el mismo reporte 10 veces en un minuto), solo corta un loop
            // accidental o un abuso deliberado.
            Route::middleware('throttle:10,1')->get('/sales-report/export', 'exportSalesReport');
        });

        Route::middleware('permission:viewCloseSales')->get('/credit-customers', 'creditCustomers');

        // Resumen de apartados (tarjetas del tab Apartados) — antes del grupo {order} para que
        // Laravel no intente resolver "layaways" como un id de orden.
        Route::middleware(['permission:layaway', 'retail'])
            ->get('/layaways/summary', [LayawayController::class, 'summary']);

        Route::middleware('permission:printTicket')->get('/print/test-bytes', [PrintController::class, 'testBytes']);

        // Combobox de órdenes cerradas para el modal de Devolución (Inventario) — debe ir
        // antes del grupo {order} para que Laravel no intente resolverlo como un id de orden.
        Route::middleware(['permission:manageStock', 'retail.stock'])->get('/closed-list', 'listClosed');

        Route::prefix('{order}')->group(function () {
            Route::get('', 'show');
            Route::get('total', 'total');
            // update() atiende 3 intenciones distintas (renombrar/cerrar-cobrar/marcar
            // servida), cada una con su propio permiso — se valida por campo dentro de
            // OrderCloseService, no aquí (un solo permission:xxx sería incorrecto).
            Route::put('', 'update');
            Route::middleware('permission:deleteOrder')->delete('', 'delete');

            // Apartados (solo retail): anticipo + abonos hasta liquidar. Permiso propio
            // `layaway` — Admin siempre pasa; Caja lo trae por defecto.
            Route::prefix('layaway')->middleware(['permission:layaway', 'retail'])
                ->controller(LayawayController::class)->group(function () {
                    Route::get('', 'show');
                    Route::post('', 'store');
                    Route::post('payment', 'payment');
                    Route::post('cancel', 'cancel');
                });
            Route::middleware('permission:printTicket')->prefix('print')->group(base_path('routes/modules/printer.php'));

            // products (plural) — alta en lote del carrito completo, un request en vez de
            // uno por línea (ver OrderProductService::addProducts). Mismo permiso que el
            // alta individual de abajo.
            Route::middleware('permission:takeOrder,viewOrders')
                ->post('products', [OrderProductController::class, 'storeBatch']);

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

                    // Devolución de stock — módulo de Inventario, exclusivo de negocios
                    // retail con stock_enabled (ver RetailStockMiddleware). Solo aplica
                    // sobre órdenes ya cerradas (validado en OrderProductReturnRequest).
                    Route::middleware(['permission:manageStock', 'retail.stock'])
                        ->post('{item}/return', 'returnStock');
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
