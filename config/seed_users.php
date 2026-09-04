<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cuentas sembradas por UserSeeder
    |--------------------------------------------------------------------------
    |
    | Usado por UserSeeder, que corre en cada arranque del contenedor (ver
    | docker/php/laravel_setup.sh) — config cacheable en producción, a
    | diferencia de env() llamado directo en el código.
    |
    */

    'super_admin' => [
        'username' => env('APP_SUPER_ADMIN_USER'),
        'email' => env('APP_SUPER_ADMIN_EMAIL'),
        'password' => env('APP_SUPER_ADMIN_PASSWORD'),
    ],

    'admin' => [
        'username' => env('APP_ADMIN_USER'),
        'email' => env('APP_ADMIN_EMAIL'),
        'password' => env('APP_ADMIN_PASSWORD'),
    ],

    'employe' => [
        'username' => env('APP_USER_USER'),
        'email' => env('APP_USER_EMAIL'),
        'password' => env('APP_USER_PASSWORD'),
    ],

];
