<?php

use App\Http\Controllers\BranchesController;
use Illuminate\Support\Facades\Route;

Route::prefix('branch')->controller(BranchesController::class)->group(function () {
    // Cualquier usuario autenticado del tenant puede leer sus propias sucursales
    // autorizadas — lo necesita el selector de apertura de caja y el form de producto.
    Route::get('/list', 'list');

    Route::middleware('role.admin')->group(function () {
        Route::get('/', 'index');
        Route::post('', 'store');

        Route::prefix('{branch}')->group(function () {
            Route::get('', 'show');
            Route::put('', 'update');
            Route::delete('', 'delete');
            Route::put('users', 'syncUsers');
        });
    });
});
