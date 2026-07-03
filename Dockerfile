# ── Stage 1: build frontend ──────────────────────────────────────────────────
FROM node:22-alpine AS frontend

ARG VITE_APP_URL=https://pos-app-rpts9.ondigitalocean.app
ARG VITE_APP_NAME=POS
ARG VITE_REVERB_APP_KEY=
ARG VITE_REVERB_HOST=pos-app-rpts9.ondigitalocean.app
ARG VITE_REVERB_PORT=443
ARG VITE_REVERB_SCHEME=https

ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY
ENV VITE_REVERB_HOST=$VITE_REVERB_HOST
ENV VITE_REVERB_PORT=$VITE_REVERB_PORT
ENV VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# ── Stage 2: PHP / Laravel ────────────────────────────────────────────────────
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
COPY docker/nginx/default.conf /etc/nginx/sites-available/default
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

WORKDIR /var/www/html

# Copiar código fuente
COPY --chown=www-data:www-data . .

# Copiar assets compilados del stage frontend
COPY --from=frontend --chown=www-data:www-data /app/public/build ./public/build

# Instalar dependencias PHP de producción
RUN composer install --no-dev --optimize-autoloader --no-interaction

RUN mkdir -p /var/www/.cache storage/framework/sessions storage/framework/views \
    storage/framework/cache storage/logs bootstrap/cache \
    && chown -R www-data:www-data /var/www/html /var/www/.cache \
    && chmod -R 775 storage bootstrap/cache

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
