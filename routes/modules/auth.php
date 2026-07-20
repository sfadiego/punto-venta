<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::controller(AuthController::class)->group(function () {
    Route::post('register', 'register')->middleware('throttle:register');
    Route::post('login', 'login')->middleware('throttle:login');
});

Route::middleware('auth:sanctum')
    ->controller(AuthController::class)->group(function () {
        Route::post('logout', 'logout');
    });
