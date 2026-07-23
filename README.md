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

## Impresión de tickets

El sistema soporta dos formas de imprimir, independientes entre sí — un tenant puede tener una, la otra, o ninguna:

| Método | Requiere | Dónde se configura |
|---|---|---|
| **Agente local (`.exe`/binario)** | Una computadora (Windows/macOS/Linux) corriendo `printer-agent`, impresora USB conectada a ella | SuperAdmin → Clientes → editar tenant → switch "Agente de impresión" |
| **Bluetooth (tablets)** | Un navegador Chrome/Edge en Android, impresora térmica BLE | SuperAdmin → Clientes → editar tenant → switch "Impresión por Bluetooth (tablets)" |

### Impresión por Bluetooth — configurar una impresora

1. **Habilitar el feature para el cliente** (una sola vez, por SuperAdmin): Clientes → editar el tenant → activar "Impresión por Bluetooth (tablets)". Sin esto, la sección no aparece en el panel de administración del negocio.
2. **Emparejar desde la tablet**: con la impresora encendida, entrar a **Configuración → Impresora** en el panel del negocio (con sesión iniciada en ese tenant) y presionar **"Emparejar"**. Chrome muestra el selector nativo de dispositivos Bluetooth — elegir la impresora de la lista.
3. El emparejamiento se guarda en el propio navegador/dispositivo (no en el servidor) y se reconecta solo en sesiones futuras — no hay que repetir el paso cada vez que se abre la app, salvo que se use "Olvidar" o se cambie de tablet.
4. Probar con el botón **"Imprimir prueba"** antes de usarla en producción.

**Requisito ineludible: HTTPS.** Web Bluetooth (la API del navegador que se usa) solo funciona en un contexto seguro — la URL real de producción con su certificado ya cumple esto sin configuración adicional. Para probar en local hace falta un túnel HTTPS (ver sección de Docker/deploy) o `mkcert`; una IP de LAN por `http://` **no** sirve para esta feature específica, aunque el resto de la app sí cargue.

### Impresoras compatibles

La impresora debe ser una **térmica ESC/POS con Bluetooth Low Energy (BLE)** — no cualquier "impresora Bluetooth" sirve:

- ✅ **Compatible**: la inmensa mayoría de impresoras térmicas genéricas de 58mm/80mm que se venden para POS móvil (ej. modelos tipo `POS-58`/`POS-5890xx`, y marcas blancas equivalentes) — usan internamente un módulo BLE de referencia (HM-10, Microchip transparent UART, o similar) que ya está soportado. Probado y confirmado con **POS-5890U-I**.
- ❌ **No compatible**: impresoras que solo hablan **Bluetooth clásico (SPP)** en vez de BLE. Web Bluetooth (la API del navegador) únicamente puede hablar con dispositivos BLE — no hay forma de sortear esto desde el navegador. Muchas impresoras económicas usan SPP; no hay manera de saberlo con certeza solo por la ficha técnica, hay que probarlo.

**¿Cómo saber si una impresora nueva es compatible?** Simplemente intentar el flujo de emparejamiento (arriba). Si la impresora aparece en el selector de Chrome y el emparejamiento termina exitosamente, es compatible. Si el emparejamiento falla con "No se encontró un canal de escritura conocido en esta impresora", es porque su módulo BLE usa un UUID de servicio distinto a los conocidos — hay que agregarlo a `BLE_PRINTER_CANDIDATE_SERVICES` en `resources/js/utils/blePrinter.ts` (se puede descubrir el UUID con cualquier app/herramienta de escaneo BLE genérica).

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

## Tests

Los tests corren contra **SQLite en memoria** — nunca tocan la base de datos MySQL de desarrollo.

### Correr los tests

```bash
composer test
```

> **No usar `php artisan test` directamente.** El script `composer test` limpia el config cache antes de ejecutar PHPUnit, lo que garantiza que el override de SQLite aplique correctamente. Si se ejecuta `php artisan test` sin limpiar el cache, los tests pueden correr contra MySQL y borrar todos los datos de desarrollo.

### Cómo funciona el aislamiento

`TestCase::refreshApplication()` sobrescribe la conexión a `sqlite` / `:memory:` justo después de que Laravel carga el `.env` pero antes de que `RefreshDatabase` corra las migraciones. Esto protege la base de datos MySQL sin importar qué tenga el `.env` o el config cache.

---

## Calidad de código

### Pre-commit hook

El proyecto incluye un hook de Git que verifica las reglas de `CLAUDE.md` antes de cada commit: TypeScript sin errores, ESLint, sin importaciones directas de axios en pages/components, e interfaces de dominio en `models/`.

Se activa automáticamente al instalar dependencias:

```bash
pnpm install
```

Si el hook no se activó (por ejemplo, clonaste antes de que existiera), actívalo manualmente:

```bash
git config core.hooksPath .hooks
```

### CI en Pull Requests

Cada PR a `main` o `develop` ejecuta automáticamente en GitHub Actions:

| Check | Qué verifica |
|---|---|
| **TypeScript** | `tsc --noEmit` — sin errores de tipos |
| **ESLint** | Reglas de estilo + reglas de CLAUDE.md |
| **Reglas estructurales** | Nombres de archivos, axios directo, interfaces fuera de `models/`, inline styles |

### Reglas ESLint de CLAUDE.md

Las siguientes prácticas bloquean el lint:

| Regla | Alternativa correcta |
|---|---|
| `import ... from 'bootstrap-icons'` | Usar `lucide-react` |
| `import ... from 'zustand'` | Usar TanStack Query |
| `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<td>`, `<th>` en JSX | Usar el componente `DataTable` |

---

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