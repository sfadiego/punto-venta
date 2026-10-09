<?php

use App\Http\Controllers\PrinterAgentController;
use Illuminate\Support\Facades\Route;

// Descarga del instalador del agente desde la Configuración del propio negocio, para no depender de una
// sesión SuperAdmin en la máquina del cliente. Solo el Admin del tenant (CLAUDE.md: acceso explícito).
Route::prefix('printer-agent')->controller(PrinterAgentController::class)->middleware('role.admin')->group(function () {
    Route::post('/download', 'download');
});
