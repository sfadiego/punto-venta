# Chantico

Chantico es un proyecto de Laravel que permite gestionar las ventas de un cafeteria.

## Entorno de Desarrollo

Copiar el archivo `.env.example` a `.env` y ajustar las variables de entorno.

### Generar claves de Reverb (WebSocket)

```bash
php artisan reverb:install
```

Esto genera y agrega automáticamente `REVERB_APP_ID`, `REVERB_APP_KEY` y `REVERB_APP_SECRET` al `.env`.

### Levantar servicios en desarrollo

```bash
# Terminal 1 — Laravel
php artisan serve

# Terminal 2 — Vite
pnpm run dev

# Terminal 3 — Reverb WebSocket
php artisan reverb:start
```

## Docker

El contenedor incluye nginx + php-fpm + **Reverb** gestionados por Supervisor. No se necesita un proceso externo para WebSocket en producción.

```bash
docker compose up --build -d
```

```bash
docker compose down
```

### Variables de build requeridas (Dockerfile ARGs)

| ARG | Descripción | Ejemplo |
|---|---|---|
| `VITE_APP_URL` | URL pública de la app | `https://mi-app.com` |
| `VITE_REVERB_APP_KEY` | Clave pública de Reverb | valor de `REVERB_APP_KEY` en `.env` |
| `VITE_REVERB_HOST` | Host público de la app | `mi-app.com` |
| `VITE_REVERB_PORT` | Puerto público (nginx proxy) | `443` en HTTPS |
| `VITE_REVERB_SCHEME` | Esquema | `https` |

Nginx dentro del contenedor actúa como proxy WebSocket: redirige `/app/*` a Reverb en el puerto interno 6001.

### Migrations
se agrego columna correr migraciones

```
php artisan migrate
```

## Flujo de ramas (Git)

```
main
 └── develop
      └── feat/nueva-funcionalidad
```

| Rama | Propósito |
|---|---|
| `main` | Código estable listo para producción |
| `develop` | Integración de features en desarrollo |
| `feat/*` | Nueva funcionalidad, creada desde `develop` |

**Pasos para una nueva funcionalidad:**

```bash
git checkout develop
git pull origin develop
git checkout -b feat/nombre-funcionalidad

# ... desarrollo ...

# PR de feat/nombre-funcionalidad → develop
```

Cuando `develop` esté estable se hace el merge final a `main`.

---

### Seeds

se agregaron iconos, correr manualmente 
```
php artisan db:seed --class=CategoriesIconsSeeder
php artisan db:seed --class={SeederName}
```