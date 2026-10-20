---
name: backend-laravel
description: "Reglas de backend Laravel del POS. Usar al crear o modificar controllers, services, FormRequests, rutas en routes/modules, factories, multi-tenancy (HasTenant, TenantScope) o transacciones."
---

# Reglas de backend (Laravel)

### Backend (Laravel)

**Controladores**
- Deben ser delgados: reciben el Request/FormRequest ya validado, delegan la lógica a un Service, retornan
  `Response::success(...)`. Referencia: `CategoriesController`, `CustomersController`.
- No poner queries complejas, transacciones, o reglas de negocio directamente en el controller — extraerlas a
  `app/Services/`.
- **No usar `DB::transaction()` en controladores ni en servicios.** Las transacciones las maneja `TransactionMiddleware`
  (registrado en `bootstrap/app.php` via `$middleware->appendToGroup('api', TransactionMiddleware::class)`), que
  envuelve automáticamente toda request no-GET en una transacción con reintentos en caso de deadlock (errores MySQL
  1213/1205). Agregar un `DB::transaction()` adicional solo crea un savepoint anidado innecesario y puede
  interferir con la lógica de retry del middleware.
- La única excepción permitida es `->lockForUpdate()` dentro de la request cuando se requiere serializar acceso
  concurrente a una fila (ej. decrementar balance de un cliente). El lock debe ir sin wrapper de transacción
  propio — ya está dentro de la transacción del middleware.
- No usar `$request->validate([...])` inline en el controller — crear un FormRequest dedicado en
  `app/Http/Requests/` (patrón: `{Recurso}{Store|Update}Request.php`), incluso si el endpoint no mapea 1:1 a un
  modelo (ej. `OrderStoreSaleRequest` para `POST /order/sale`).
- **Inyección de Services — respeta la convención ya establecida en esa clase, no la mezcles.** Hay dos
  convenciones válidas y ambas conviven en el proyecto:
  - Constructor injection de un Service "dueño" de la clase, reutilizado por todos los métodos vía
    `$this->service` (ej. `OrderProductController` con `OrderProductService`). Si el controller ya usa este
    patrón y necesitas un Service adicional para una acción nueva (ej. `OrderReturnService` para
    `returnStock()`), agrégalo al constructor igual que el resto — no lo inyectes como parámetro del método
    aunque solo lo use esa única acción.
  - Injection por método, uno distinto por acción (ej. `ProductController`, que no tiene Service en el
    constructor y cada método pide el suyo: `store(..., StockService $stockService)`).
  Antes de agregar un método nuevo a un controller existente, revisa cuál de las dos usa esa clase y síguela —
  mezclar ambas en el mismo archivo es la señal de que no se respetó la convención ya establecida.

**Cuándo extraer un controller/acción a un Service** — señales de que ya debe hacerse (no esperar a
que "se sienta grande"), tomadas de la auditoría 2026-09 (`OrderProductController.php` tenía 408
líneas de matemática de subtotal, resolución de precio de catálogo y reglas de transición de estatus
mezcladas con el controller):
- La acción del controller supera ~30-40 líneas de lógica (más allá de leer el request y responder).
- Hace más de una query de negocio encadenada (no solo el `find()` del route-model-binding) o alguna
  transacción/side-effect (descuento de stock, cálculo de totales, broadcast de eventos).
- Ya existe un Service para el flujo equivalente en otro contexto y este es su "gemelo" sin extraer
  (ej. `PublicOrderService` se creó porque `MenuController::store` duplicaba a mano lo que
  `OrderSaleService` ya resolvía para el flujo autenticado).
- Al extraer, sigue el patrón de dos capas de abajo — nunca dejes lógica de negocio real "temporal"
  en el controller con la idea de moverla después.

**Código duplicado — extraer apenas se repite una tercera vez, no esperar a "ya se volvió un
problema":**
- Un bloque de lógica (no solo una línea trivial) copiado en 2+ métodos/archivos es candidato a
  helper. Ejemplos reales ya resueltos: el patrón
  `DB::afterCommit(fn() => try { OrdersUpdated::dispatch(...) } catch (\Throwable) {})` repetido 4
  veces se extrajo a `OrdersUpdated::dispatchAfterCommit()`; la fórmula
  `round($precio * $cantidad * (1 - $descuento / 100), 2)` repetida 4 veces y el bloque de
  `DB::table('order')->update([...])` repetido 5 veces en `OrderProductController.php` se
  consolidaron al extraer `OrderProductService`; el patrón "resolver tenant por slug + 404 si no
  existe + bind `tenant_id`" repetido en las 4 acciones de `MenuController.php` se extrajo a un
  helper privado (`resolveTenantOrFail()`).
- Un helper de dominio (formateo, cálculo, mapeo) nunca vive duplicado dentro de dos Services/
  Controllers — extraer a un método privado reutilizable dentro del Service dueño de esa lógica, o a
  una clase de utilidad si lo usan varios Services sin relación entre sí.
- Antes de copiar/pegar un bloque de un controller/service a otro archivo nuevo, para resolver algo
  "parecido pero no igual", detente: es la señal más clara de que ya existe una abstracción faltante.

**Servicios — dos patrones, no mezclarlos en un mismo archivo:**
1. **Listado paginado** (`extends App\Core\Paginator\DataTable`): un servicio por recurso listable, implementa
   `tableHeaders()` y `makeQuery()`. Los filtros se leen con `request()->query(...)` dentro de `makeQuery()`
   (nunca vía constructor). Ejemplos: `CategoryService`, `CustomerService`, `OrderService`, `UserService`,
   `TenantService`.
   - Ojo: `DataTable::build()` solo invoca `runCustomQueryFilters()` si `customQueryFilters()` retorna un array
     no vacío — nadie lo sobrescribe hoy, así que ese hook nunca se ejecuta. Para filtros custom, aplícalos
     directamente dentro de `makeQuery()` (ver `CustomerService::makeQuery()`), no dependas de
     `runCustomQueryFilters()`.
2. **Lógica de negocio plana** (sin heredar de nada): para operaciones que no son "listar con filtros" —
   transacciones, side-effects, cálculos, reportes. Ejemplos: `OrderCreditService` (aplica balance de crédito al
   cerrar una venta), `OrderSaleService` (venta directa + reporte por categoría), `LoginRateLimitService`.
- No agregues métodos de negocio a un servicio `DataTable` (ej. no metas `createDirectSale()` dentro de
  `OrderService`) — crea un servicio nuevo y enfocado en su lugar.

**Multi-tenancy**
- Todo modelo tenant-scoped usa el trait `HasTenant` (agrega `TenantScope` como global scope + auto-asigna
  `tenant_id` en creación desde `app('tenant_id')`).
- Las reglas de validación `exists:`/`unique:` de Laravel **no respetan global scopes** — para cualquier FK
  tenant-scoped hay que usar `Rule::exists('tabla', 'id')->where('tenant_id', app('tenant_id'))` o
  `Rule::unique(...)->where('tenant_id', ...)`.
- **Importante**: el middleware `ResolveTenant` (que asigna `app('tenant_id')`) debe correr ANTES que
  `SubstituteBindings` (el middleware de Laravel que resuelve `{modelo}` en las rutas vía route-model-binding
  implícito) — esto está garantizado por `$middleware->prependToPriorityList(...)` en `bootstrap/app.php`. No
  toques ese orden sin entender la implicación: si se rompe, el binding implícito de rutas deja de filtrar por
  tenant y cualquier admin autenticado podría acceder a recursos de otro tenant adivinando el ID (bug real que
  se encontró y corrigió — ver commit de la feature de clientes fiado).
- Fuera de una request HTTP (tinker, seeders, algunos tests) no hay `tenant_id` bindeado en el contenedor — hay
  que pasarlo explícito al crear registros: `Model::create(['tenant_id' => $id, ...])`.

**Rutas**
- Un archivo por recurso en `routes/modules/`, requerido desde `routes/api.php` dentro del grupo de middleware
  tenant-scoped (o desde `routes/modules/superadmin.php`, que tiene su propio grupo de middleware).
- Patrón por recurso (ver `routes/modules/categories.php` o `customers.php`):
  `Route::prefix('recurso')->controller(Controller::class)->group(...)` con `index`, `list` (versión ligera sin
  paginar, para dropdowns/pickers), `store`, y `Route::prefix('{recurso}')` anidado para `show/update/delete` +
  acciones custom (ej. `toggle-credit`, `payment`).

**Factories**
- Un factory por modelo en `database/factories/{Model}Factory.php` — Laravel lo resuelve automáticamente por
  convención de nombre si el modelo usa `HasFactory`.
- `factory()->create($atributos)` — el argumento es un **array de overrides**, no un contador. Para crear
  varios registros: `factory()->count(N)->create()`.
