<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->file(public_path('landing/index.html'));
});

Route::get('/{any}', function () {
    return response(view('index'))
        ->header('Cache-Control', 'no-store, no-cache, must-revalidate');
})->where('any', '^(?!api).*$');
