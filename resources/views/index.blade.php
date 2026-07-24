<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ env('APP_NAME') }}</title>
    <script>
        // Pinta los colores del tenant cacheados en el reload anterior antes de que
        // cargue el bundle de React, para evitar el flash de los colores default de
        // app.css. Ver resources/js/utils/businessConfigCache.ts.
        (function () {
            try {
                var raw = localStorage.getItem('businessConfig');
                if (!raw) return;
                var config = JSON.parse(raw);
                var root = document.documentElement.style;
                if (config.primary_color) root.setProperty('--color-primary', config.primary_color);
                if (config.sidebar_color) root.setProperty('--color-sidebar', config.sidebar_color);
                if (config.font_color) root.setProperty('--color-font', config.font_color);
                if (config.label_color) root.setProperty('--color-label', config.label_color);
            } catch (e) {}
        })();
    </script>
    @viteReactRefresh
    @vite(['resources/css/app.css', 'resources/js/main.tsx'])
</head>

<body>
    <div id="root">
        <noscript>
            <strong>
                Lo sentimos, este sitio no funciona correctamente sin Javascript. Habilitalo para poder
                continuar
            </strong>
        </noscript>
    </div>
</body>
</html>
