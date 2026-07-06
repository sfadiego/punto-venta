#!/usr/bin/env sh
set -e

APP_DIR="/var/www/html"
cd "$APP_DIR"

echo "Reparando permisos de storage..."
mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache storage/logs bootstrap/cache
chmod -R 777 storage bootstrap/cache

echo "Ejecutando migraciones..."
php artisan migrate --force || echo "Migraciones fallidas o ya ejecutadas"

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
