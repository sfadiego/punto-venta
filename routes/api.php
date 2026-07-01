<?php

use App\Http\Controllers\ClientErrorController;
use App\Http\Middleware\ResolveTenant;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(base_path('routes/modules/auth.php'));

// Reporte de errores del frontend — público, sin auth
Route::post('client-error', [ClientErrorController::class, 'store']);

// Archivos estáticos — acceso público, el path actúa como token opaco
require base_path('routes/modules/files.php');

// Tenant branding público (para la pantalla de login personalizada)
require base_path('routes/modules/tenant.php');

// Panel super-admin
require base_path('routes/modules/superadmin.php');

Route::middleware(['auth:sanctum', ResolveTenant::class, 'check.subscription'])->group(function () {
    require base_path('routes/modules/categories.php');
    require base_path('routes/modules/orders.php');
    require base_path('routes/modules/products.php');
    require base_path('routes/modules/orderstatus.php');
    require base_path('routes/modules/system.php');
});
