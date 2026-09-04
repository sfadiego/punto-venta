# ── Stage 1: build frontend ──────────────────────────────────────────────────
FROM node:22-alpine AS frontend

ARG VITE_APP_URL=https://pos-app-rpts9.ondigitalocean.app
ARG VITE_APP_NAME=POS
ARG VITE_APP_ENV=production
ARG VITE_REVERB_APP_KEY=
ARG VITE_REVERB_HOST=pos-app-rpts9.ondigitalocean.app
ARG VITE_REVERB_PORT=443
ARG VITE_REVERB_SCHEME=https

ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ENV VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME

WORKDIR /app

RUN npm install -g pnpm@9.3.0

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Escribir .env explícitamente para que Vite tome los valores correctos en build time
RUN printf "VITE_APP_URL=%s\nVITE_APP_NAME=%s\nVITE_APP_ENV=%s\nVITE_REVERB_APP_KEY=%s\nVITE_REVERB_HOST=%s\nVITE_REVERB_PORT=%s\nVITE_REVERB_SCHEME=%s\n" \
    "$VITE_APP_URL" "$VITE_APP_NAME" "$VITE_APP_ENV" "$VITE_REVERB_APP_KEY" "$VITE_REVERB_HOST" "$VITE_REVERB_PORT" "$VITE_REVERB_SCHEME" > .env

RUN pnpm run build

# ── Stage 2: build printer-agent binaries ─────────────────────────────────────
# Stage aislado en su propio contexto (solo printer-agent/) para que el cross-compile
# de los binarios (lento, cross-compilación con pkg) no se vuelva a ejecutar en cada
# deploy solo porque cambió código de la app o del frontend — antes vivía después del
# `COPY . .` del stage de frontend, así que CUALQUIER cambio en el repo invalidaba
# también esta capa.
FROM node:22-alpine AS printer-agent

WORKDIR /app/printer-agent

COPY printer-agent/package.json ./
RUN npm install

COPY printer-agent/ ./
RUN mkdir -p /app/storage/app/printer-agent \
    && npx pkg index.js --targets node18-win-x64,node18-macos-x64 --output /app/storage/app/printer-agent/print-agent

# ── Stage 3: PHP / Laravel ────────────────────────────────────────────────────
FROM php:8.4-fpm AS php

RUN apt-get update && apt-get install -y \
    libzip-dev \
    libonig-dev \
    unzip \
    git \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    nginx \
    supervisor \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql mbstring zip gd pcntl \
    && rm -rf /var/lib/apt/lists/*

RUN usermod -u 1000 www-data && groupmod -g 1000 www-data

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Entrypoint y configs
COPY docker/php/*.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/*.sh
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini
COPY docker/php/php-fpm.conf /usr/local/etc/php-fpm.d/zz-app.conf
COPY docker/nginx/default.conf /etc/nginx/sites-available/default
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Habilitar OPcache (viene incluido en la imagen php pero deshabilitado por defecto)
RUN docker-php-ext-enable opcache

WORKDIR /var/www/html

# Timeout más generoso: la descarga de paquetes desde GitHub ocasionalmente
# responde 504 y Composer no reintenta solo dentro del tiempo por defecto.
ENV COMPOSER_PROCESS_TIMEOUT=600

# Instalar dependencias PHP ANTES de copiar el resto del código fuente: esta capa solo
# se invalida cuando composer.json/composer.lock cambian, no en cada commit (antes el
# `COPY . .` completo venía primero, así que un cambio de un solo .tsx forzaba re-descargar
# todo vendor/ en cada deploy). --no-scripts/--no-autoloader porque los scripts de Laravel
# (package:discover) y el autoloader optimizado necesitan el código de la app, que todavía
# no existe en este punto — se completan más abajo con `composer dump-autoload`.
# Reintentos ante fallas de red transitorias: si los 3 intentos fallan, el último comando
# debe ser el que falló para que el exit code del RUN refleje el error real, no el "sleep".
COPY composer.json composer.lock ./
RUN success=0; \
    for i in 1 2 3; do \
        if composer install --no-dev --no-scripts --no-autoloader --no-interaction; then \
            success=1; break; \
        fi; \
        echo "composer install falló (intento $i/3), reintentando en 5s..."; \
        sleep 5; \
    done; \
    [ "$success" = "1" ]

# Copiar código fuente
COPY --chown=www-data:www-data . .

# Copiar assets compilados del stage frontend
COPY --from=frontend --chown=www-data:www-data /app/public/build ./public/build

# Copiar binarios del agente de impresión (stage aislado — ver comentario arriba)
COPY --from=printer-agent --chown=www-data:www-data /app/storage/app/printer-agent ./storage/app/printer-agent

# Generar el autoloader optimizado y correr los scripts de Composer/Laravel (package:discover)
# ahora que el código fuente completo está presente. Sin red, rápido.
RUN composer dump-autoload --optimize --no-dev

RUN mkdir -p /var/www/.cache storage/framework/sessions storage/framework/views \
    storage/framework/cache storage/logs bootstrap/cache \
    && chown -R www-data:www-data /var/www/html /var/www/.cache \
    && chmod -R 775 storage bootstrap/cache

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
