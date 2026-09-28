# Escalamiento — cuellos de botella para cientos de usuarios concurrentes

Auditoría realizada 2026-09-28. Estado actual: `apps-s-1vcpu-1gb`, `instance_count: 1`,
`pm.max_children = 10` (dynamic, ver `docker/php/php-fpm.conf`) — suficiente para el tráfico
actual, **no** para cientos de usuarios concurrentes. Este documento es la referencia para
cuando haya que resolverlo de verdad, no una tarea pendiente activa.

---

## 1. Infraestructura (`.do/app.yaml`, Dockerfile, docker/)

### 1.1 PHP-FPM — el cuello de botella real
`docker/php/php-fpm.conf`. Ya se aplicó la Opción A (pm=dynamic, techo=10) — alivio parcial
dentro de la instancia actual, no resuelve concurrencia alta.

- **Opción B** — subir tamaño de instancia (ej. `apps-s-2vcpu-4gb` o más) + subir
  `pm.max_children` proporcionalmente (20-30). Es lo que resuelve "cientos de usuarios" en una
  sola instancia. Costo: mayor tarifa mensual de DO, sin cambios de arquitectura.
- **Opción C** — B + separar Reverb a su propio componente/instancia (para que un pico de
  WebSocket no le quite CPU a PHP-FPM y viceversa) + Redis administrado +
  `REVERB_SCALING_ENABLED=true` (`config/reverb.php:36-47`, ya soporta esto, solo está
  apagado). Necesario si algún día se sube `instance_count` por encima de 1 — con Reverb
  sin clustering, un usuario conectado a la instancia A nunca ve eventos disparados en la B.

### 1.2 Instancia única, Reverb sin clustering
`.do/app.yaml:237-238` (`instance_count: 1`). No se puede subir este número hoy sin romper el
broadcast — ver 1.1 Opción C como prerrequisito.

### 1.3 Secretos en texto plano en `.do/app.yaml`
Hallazgo aparte (no es de concurrencia, pero se vio de paso durante la auditoría):
`APP_KEY`, `REVERB_APP_SECRET`, `APP_ADMIN_PASSWORD`, etc. están en texto plano en un archivo
versionado en git. Vale la pena moverlos a DO "encrypted secrets" en algún momento — no
urgente para el problema de concurrencia, pero es una exposición real.

---

## 2. Backend — dónde topa el throughput bajo carga alta

**Resuelto 2026-09-28** — los 3 puntos de esta sección ya se implementaron, sin afectar el
uso normal (límites generosos, cambios internos invisibles para el usuario):

### 2.1 Descuento de stock secuencial por línea de venta — mitigado
`OrderSaleService::createDirectSale()` y `OrderCloseService::deductStockForOrder()` seguían
siendo secuenciales línea por línea (correcto, no se puede paralelizar sin arriesgar
sobregiro de inventario), pero ahora **ordenan las líneas por `product_id` antes de
descontar** — dos ventas concurrentes que comparten productos en distinto orden en el
carrito ya no pueden bloquearse en direcciones opuestas (deadlock clásico A-espera-B/
B-espera-A). El orden de creación de `order_product` (lo que ve el ticket) no cambió.

### 2.2 Reintento de deadlock sin backoff — resuelto
`app/Http/Middleware/TransactionMiddleware.php` ahora espera 50-150ms (jitter aleatorio)
antes de cada reintento por deadlock/lock-wait-timeout, en vez de reintentar en el mismo
instante. Imperceptible para el usuario, evita que varios reintentos vuelvan a chocar entre
sí bajo carga alta.

### 2.3 Endpoint de reporte sin throttle ni límite de filas — resuelto
`GET /order/sales-report/export`:
- `throttle:10,1` en la ruta (`routes/modules/orders.php`) — 10 exportaciones/minuto por
  usuario, generoso a propósito, no afecta uso normal.
- `SalesReportExportService::MAX_ROWS = 5000` — si el período pedido excede el tope, responde
  422 con mensaje pidiendo acotar el rango, en vez de generar un PDF gigante con DomPDF.

Tests: `tests/Orders/OrderTest.php` — `test_export_reporte_ventas_rechaza_periodo_con_demasiadas_filas`,
`test_export_reporte_ventas_limita_a_10_por_minuto`.

---

## 3. Frontend — carga que el propio cliente le mete al backend

**Resuelto 2026-09-28** — los 4 puntos de esta sección ya se implementaron.

### 3.1 Reintentos por default de TanStack Query amplifican una caída — resuelto
En vez de tocar cada hook uno por uno, se puso `retry: false` como default global del
`QueryClient` (`resources/js/app.tsx`) — cubre automáticamente `useInfiniteIndexOrder`,
`useCustomerList`, `useBranchList`, todo SuperAdmin, y cualquier query nueva que se agregue a
futuro sin acordarse de ponerlo. Una query que sí necesite reintentar puede sobreescribirlo
localmente.

### 3.2 Poll redundante sobre un WebSocket que ya funciona — resuelto
Se quitó `refetchInterval: 60_000` de `useInfiniteIndexOrder` (`useOrderService.ts`) —
`useOrdersSocket` ya refresca esa misma query (queryKey `"orders-infinite"`) en cada evento
`.orders.updated`, confirmado por match exacto.

### 3.3 `staleTime: 0` en la lista de clientes — resuelto
`useCustomerList` (`useCustomerService.ts`) subió de `staleTime: 0` a `staleTime: 8_000` —
cubre aperturas rápidas repetidas del modal de cobro sin re-pedir la lista completa cada vez.

### 3.4 Checkout de QuickSale — una petición por producto del carrito — resuelto
`useResumeOrder.ts::createOrderFromCart()` hacía `for (const item of cart) { await
createOrderProduct(...) }`, un `POST` secuencial por línea. Ahora manda todo el carrito en un
solo request:

- **Backend**: `POST /order/{order}/products` (nuevo, `OrderProductController::storeBatch` →
  `OrderProductService::addProducts()`) — un solo `lockForUpdate()`, precarga de
  productos/variantes con `whereIn(...)->keyBy(...)`, un solo delta de subtotal/total, un solo
  `OrdersUpdated::dispatchAfterCommit()`. `OrderProductBatchStoreRequest` valida cada línea
  igual que el endpoint singular (disponibilidad por sucursal, variante pertenece al
  producto), y además **suma las cantidades del mismo producto/variante dentro del mismo
  batch** antes de comparar contra el stock disponible (dos líneas de 3 c/u no pasan si el
  stock es 5, aunque cada una por separado sí pasaría).
- **Frontend**: nuevo `useCreateOrderProducts()` (`useOrderService.ts`), usado por
  `createOrderFromCart()` en vez del loop.
- Solo cubre productos de catálogo (el carrito de QuickSale nunca trae "extras" con nombre
  libre) — el endpoint singular (`POST /order/{id}/product`) sigue igual, lo sigue usando
  Órdenes/TakeOrder para agregar de uno en uno mientras se arma el pedido.

Tests: `tests/Orders/OrderProductTest.php`, sección "StoreBatch — checkout de QuickSale" (9
casos: alta múltiple, precio resuelto del catálogo, un solo evento disparado, batch vacío,
stock insuficiente rechaza toda la request sin aplicar parcial, suma de cantidades del mismo
producto dentro del batch, batch dentro del stock funciona, orden cerrada falla, sin auth).

---

## Prioridad si se retoma esto

1. Infra (sección 1, Opción B/C) — sin esto, nada de lo demás importa; es la pared que se
   golpea primero. Secciones 2 y 3 (backend/frontend) ya están resueltas.
