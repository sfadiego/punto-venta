<?php

use App\Http\Controllers\KardexController;
use Illuminate\Support\Facades\Route;

// Kardex global del módulo de Inventario — exclusivo de negocios retail con stock_enabled
// (ver RetailStockMiddleware). No exige ningún producto de la ruta: lista todo el historial
// de stock_movements del tenant, con filtros opcionales por querystring.
Route::middleware(['permission:manageStock', 'retail.stock'])
    ->get('kardex', [KardexController::class, 'index']);
