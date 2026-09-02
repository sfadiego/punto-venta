<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Agente de impresión — defaults de entorno
    |--------------------------------------------------------------------------
    |
    | Usados solo como fallback cuando el tenant no tiene su propia impresora
    | configurada en business_config (printer_name/printer_host). Config
    | cacheable en producción (php artisan config:cache) — a diferencia de
    | env() llamado directo en el código, esto sí se resuelve correctamente.
    |
    */

    'name' => env('PRINTER_NAME', ''),

    'host' => env('PRINTER_HOST', ''),

    'driver' => env('PRINTER_DRIVER', 'network'),

    'smb_user' => env('PRINTER_SMB_USER'),

    'smb_pass' => env('PRINTER_SMB_PASS'),

];
