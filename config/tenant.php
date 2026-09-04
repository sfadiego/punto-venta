<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Slug del tenant default para seeders
    |--------------------------------------------------------------------------
    |
    | Usado por BusinessConfigSeeder y VentaPorPesoSeeder, que corren en cada
    | arranque del contenedor (docker/php/laravel_setup.sh), no solo en el
    | primer deploy. Config cacheable en producción (php artisan config:cache)
    | — a diferencia de env() llamado directo en el código, esto sí se
    | resuelve correctamente incluso después de cachear la config.
    |
    */

    'default_slug' => env('APP_TENANT_SLUG', 'demo'),

];
