<?php

use Illuminate\Support\Facades\Route;

Route::get('/{any}', function () {
    return response(view('index'))
        ->header('Cache-Control', 'no-store, no-cache, must-revalidate');
})->where('any', '^(?!api).*$');
