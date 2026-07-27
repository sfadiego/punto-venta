<?php

use App\Http\Controllers\FeatureSpotlightController;
use Illuminate\Support\Facades\Route;

Route::prefix('feature-spotlights')->controller(FeatureSpotlightController::class)->group(function () {
    Route::get('seen', 'index');
    Route::post('{key}/seen', 'markSeen');
});
