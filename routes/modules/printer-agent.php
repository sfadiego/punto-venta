<?php

use App\Http\Controllers\PrinterAgentController;

Route::prefix('printer-agent')->controller(PrinterAgentController::class)->group(function () {
    Route::post('/download', 'download');
});
