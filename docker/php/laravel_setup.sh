#!/usr/bin/env sh
set -e

APP_DIR="/var/www/html"
cd "$APP_DIR"

echo "Reparando permisos de storage..."
mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache
chmod -R 777 storage bootstrap/cache

echo "Ejecutando migraciones..."
# Una migración fallida NO se tolera: arrancar el código nuevo sobre el esquema viejo rompe
# endpoints (ej. el listado de productos consulta tablas que no existen). Se sale con el código
# 42 para que entrypoint.sh detenga el arranque del contenedor y la plataforma conserve la
# versión anterior; "nada que migrar" no es un error (artisan devuelve 0).
php artisan migrate --force || {
    echo "ERROR: fallaron las migraciones, se aborta el arranque."
    exit 42
}

echo "Ejecutando seeders..."
php artisan db:seed --force || echo "Seeders fallidos o ya ejecutados"

echo "Limpiando caches..."
php artisan config:clear || true
php artisan route:clear  || true
php artisan view:clear   || true
php artisan cache:clear  || true

echo "Optimizando Laravel..."
php artisan config:cache || true
php artisan route:cache  || true
php artisan view:cache   || true

echo "Enlace de storage..."
php artisan storage:link --force || true
