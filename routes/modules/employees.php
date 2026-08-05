<?php

use App\Http\Controllers\EmployeesController;
use Illuminate\Support\Facades\Route;

Route::prefix('employee')->group(function () {
    Route::controller(EmployeesController::class)->group(function () {
        Route::middleware('permission:viewEmployees')->group(function () {
            Route::get('/', 'index');
            Route::get('/list', 'list');
        });

        Route::middleware('role.admin')->group(function () {
            Route::post('', 'store');

            Route::prefix('{employee}')->group(function () {
                Route::get('', 'show');
                Route::put('', 'update');
                Route::delete('', 'delete');
                Route::patch('toggle-active', 'toggleActive');
            });
        });
    });
});
