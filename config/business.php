<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Configuración general del negocio/SaaS
    |--------------------------------------------------------------------------
    |
    | Valores leídos por app/Models/BusinessConfigModel.php y
    | app/Http/Controllers/Admin/BusinessConfigController.php. Vivían como
    | env() directo en esos archivos — config:cache en producción los dejaba
    | en null silenciosamente.
    |
    */

    'full_name' => env('APP_FULL_NAME', 'venta-rapida'),

    'payment_whatsapp' => env('PAYMENT_WHATSAPP'),

];
