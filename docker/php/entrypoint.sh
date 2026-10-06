#!/usr/bin/env sh
set -e

APP_DIR="/var/www/html"

# El volumen persistente se monta en storage/app/private antes de que arranque
# el contenedor, pero puede estar vacío o con permisos incorrectos en el primer deploy.
mkdir -p "$APP_DIR/storage/app/private"
chown -R www-data:www-data "$APP_DIR/storage/app/private"
chmod -R 775 "$APP_DIR/storage/app/private"

# setup laravel
# El setup es tolerante a fallos (permisos, seeders, cachés...) salvo las migraciones: laravel_setup.sh
# sale con 42 si fallan y en ese caso el contenedor no arranca.
/usr/local/bin/laravel_setup.sh || {
    status=$?
    if [ "$status" -eq 42 ]; then
        echo "ERROR: migraciones fallidas, el contenedor no arrancará."
        exit 1
    fi
    echo "Aviso: Falló el setup de Laravel"
}

# --- inicio ---
cd "$APP_DIR" || exit 1

# Ejecutar el comando que se pase al contenedor (por defecto php-fpm)
exec "$@"
