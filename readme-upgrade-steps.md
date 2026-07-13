# Guía de escalado

Pasos a seguir conforme crezca la carga. Cada etapa tiene su umbral — no implementar antes de necesitarlo.

---

## Etapa 1 — Actual (1–30 usuarios simultáneos)

Configuración actual es suficiente. No se requiere acción.

| Driver | Valor actual |
|---|---|
| Cache | `database` |
| Session | `database` |
| Queue | `database` (sin worker, síncrono) |
| WebSocket | Reverb single-process |

---

## Etapa 2 — Redis (30–200 usuarios simultáneos)

**Síntomas que indican que es momento:** lentitud perceptible en requests, CPU alta en el contenedor, queries lentas en MySQL.

### 2.1 Provisionar Redis

**Opción A — Redis Cloud (gratis hasta 30MB, recomendado para empezar)**
- Crear cuenta en [redis.io/cloud](https://redis.io/cloud)
- Copiar `host`, `port` y `password` del dashboard

**Opción B — DigitalOcean Managed Redis (~$15 USD/mes)**
- Mismo datacenter que el App, latencia mínima
- Backups automáticos y alta disponibilidad opcional

### 2.2 Variables de entorno en producción

```env
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_CLIENT=phpredis      # extensión ya instalada en el Dockerfile
REDIS_HOST=<host>
REDIS_PASSWORD=<password>
REDIS_PORT=<port>
REDIS_DB=0
REDIS_CACHE_DB=1
```

> El Dockerfile ya tiene `pecl install redis` — solo se activa cuando `REDIS_CLIENT=phpredis`.
> El `docker-compose.yml` ya tiene el servicio `redis:7-alpine` para desarrollo local.
> El `supervisord.conf` ya tiene el proceso `queue-worker` para procesar jobs con Redis.

### 2.3 Impacto esperado

- Elimina 3–6 queries SQL por request (cache, session, token tracking)
- `TrackActivity` middleware pasa de golpear MySQL a Redis en memoria
- Jobs en cola se procesan de forma asíncrona sin bloquear el request

---

## Etapa 3 — Optimizaciones de base de datos (200–500 usuarios)

**Síntomas:** queries lentas en el slow log de MySQL, tiempo de respuesta >500ms.

### 3.1 Índices faltantes a revisar

```sql
-- Validación de tokens Sanctum (query en cada request autenticado)
ALTER TABLE personal_access_tokens ADD INDEX idx_token (token(64));

-- Conteo de usuarios activos por tenant (widget SuperAdmin)
ALTER TABLE users ADD INDEX idx_tenant_last_seen (tenant_id, last_seen_at);

-- Filtro de órdenes por sistema y estado
ALTER TABLE pedidos ADD INDEX idx_sistema_estatus (sistema_id, estatus_pedido_id);
```

Verificar con `EXPLAIN` antes de crear — algunos pueden ya existir.

### 3.2 Expiración de tokens Sanctum

Sin expiración, la tabla `personal_access_tokens` crece indefinidamente y la query de validación se degrada.

```php
// config/sanctum.php
'expiration' => 60 * 24 * 30, // 30 días
```

Limpiar tokens expirados automáticamente:

```php
// routes/console.php
Schedule::command('sanctum:prune-expired --hours=720')->daily();
```

### 3.3 Limpiar tokens acumulados al login

Actualmente cada login crea un token nuevo sin eliminar los anteriores. Agregar en `AuthController::login()` antes de crear el token:

```php
$result['user']->tokens()->delete();
$token = $result['user']->createToken('access_token')->plainTextToken;
```

---

## Etapa 4 — WebSocket por tenant (500+ usuarios, múltiples negocios)

**Síntomas:** Reverb con uso alto de CPU, eventos llegando a usuarios de otros tenants.

### 4.1 Segmentar canal de órdenes por tenant

**Frontend** — `useOrdersSocket.ts`:
```ts
const tenantSlug = localStorage.getItem("tenantSlug");
echo.channel(`orders.${tenantSlug}`)
```

**Backend** — en el evento `OrderCreated` (o similar):
```php
public function broadcastOn(): array
{
    return [new Channel("orders.{$this->order->tenant->slug}")];
}
```

Impacto: cada usuario solo recibe eventos de su propio negocio. Con 10 tenants, el tráfico WebSocket se divide entre 10.

### 4.2 Eliminar polling redundante

Con WebSocket activo, el `refetchInterval` en TanStack Query es redundante. Reemplazar por invalidación reactiva al recibir el evento:

```ts
// En useOrdersSocket, al recibir evento:
queryClient.invalidateQueries({ queryKey: ["orders"] });
```

Luego eliminar `refetchInterval: 60_000` de `useOrderService`.

---

## Etapa 5 — Escala horizontal (500+ usuarios sostenidos)

Solo llegar aquí si las etapas anteriores no son suficientes.

- **Load balancer** frente a múltiples instancias del contenedor (DigitalOcean App Platform lo soporta nativamente con el slider de instancias)
- **Redis obligatorio** en este punto — las sesiones y cache deben ser compartidas entre instancias
- **Reverb en modo escalado** — requiere Redis pub/sub para sincronizar eventos entre instancias (`REVERB_SCALING_ENABLED=true`)
- **MySQL read replica** para queries de lectura pesadas (estadísticas, reportes)

---

## Referencia rápida

| Usuarios simultáneos | Acción |
|---|---|
| 1–30 | Sin cambios |
| 30–200 | Etapa 2: Redis |
| 200–500 | Etapa 3: índices + expiración de tokens |
| 500+ múltiples tenants | Etapa 4: WebSocket por tenant |
| 500+ sostenidos | Etapa 5: escala horizontal |
