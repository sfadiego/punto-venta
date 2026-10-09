<?php

use App\Http\Controllers\PrinterAgentController;
use Illuminate\Support\Facades\Route;

Route::prefix('printer-agent')->controller(PrinterAgentController::class)->group(function () {
    Route::post('/download', 'download');
});
