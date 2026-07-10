# POS-app

POS-app es un sistema POS multi-negocio construido con Laravel 12 + React 19. Soporta restaurantes/cafeterías y negocios de venta por peso (carnicería), con flujos diferenciados por tipo de negocio.

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

### Probar en tablet / dispositivo móvil (misma red WiFi)

**1. Obtener la IP local del Mac:**
```bash
ipconfig getifaddr en0
# ejemplo: 192.168.1.112
```

**2. Editar `.env`** — reemplazar `localhost` / `127.0.0.1` con la IP obtenida:
```
APP_URL=http://192.168.1.112:8000
VITE_APP_URL=http://192.168.1.112:8000
VITE_REVERB_HOST=192.168.1.112
```

**3. Editar `vite.config.js`** — sección `server`:
```js
server: {
    host: "0.0.0.0",
    port: 5173,
    hmr: { host: "192.168.1.112" },
},
```

**4. Levantar servicios:**
```bash
# Terminal 1
php artisan serve --host=0.0.0.0 --port=8000

# Terminal 2
pnpm dev

# Terminal 3 (si usas WebSocket)
php artisan reverb:start
```

**5. Abrir en la tablet:** `http://192.168.1.112:8000`

> **Al terminar las pruebas**, revertir `.env` y `vite.config.js` a sus valores originales (`localhost` / `127.0.0.1`).

---

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
| `VITE_APP_ENV` | Entorno activo — controla features de desarrollo | `production` |
| `VITE_REVERB_APP_KEY` | Clave pública de Reverb | valor de `REVERB_APP_KEY` en `.env` |
| `VITE_REVERB_HOST` | Host público de la app | `mi-app.com` |
| `VITE_REVERB_PORT` | Puerto público (nginx proxy) | `443` en HTTPS |
| `VITE_REVERB_SCHEME` | Esquema | `https` |

> **Nota:** `VITE_APP_ENV=local` activa el agente de impresión y la sección de impresora en el panel de administración sin necesitar habilitarlos por cliente desde el SuperAdmin. En producción debe ser `VITE_APP_ENV=production`.

Nginx dentro del contenedor actúa como proxy WebSocket: redirige `/app/*` a Reverb en el puerto interno 6001.

### Migrations

Siempre correr migraciones tras un pull:

```bash
php artisan migrate
```

Migraciones relevantes recientes:
- `2026_07_07_151043_drop_delivery_paid_by_from_business_config_table` — elimina `delivery_paid_by` de `business_config`.
- `2026_07_08_000001_add_printer_enabled_to_business_config_table` — agrega `printer_enabled` (boolean, default false) a `business_config`.

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