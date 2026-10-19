---
name: seguridad-endpoints
description: "Checklist de seguridad y autorizacion del POS. Usar al agregar rutas o endpoints, middleware role.admin o permission, permisos nuevos, reportes con rango de fechas, campos decimales en la API, errores expuestos al cliente, migraciones con datos existentes o tests de autorizacion."
---

# Seguridad y checklist de autorizacion

## Seguridad y checklist de autorización (lecciones de la auditoría 2026-09)

Reglas derivadas de una auditoría de seguridad/performance real sobre este repo (ver histórico de
commits "fix: refactor codigo duplicado..." y "fix: fallback a permisos por defecto..."). El hallazgo
raíz fue que `routes/modules/orders.php` y `products.php` no tenían NINGÚN middleware de rol/permiso
— cualquier usuario autenticado del tenant podía borrar órdenes, ajustar stock o borrar productos.
Estas reglas existen para no repetir esa clase de hueco.

**Toda ruta nueva bajo el grupo tenant-scoped (`routes/modules/*.php`, excepto `superadmin.php`) debe
declarar explícitamente su nivel de acceso** — nunca dejar una ruta de escritura/borrado sin
middleware "porque ya está detrás de `auth:sanctum`". Antes de agregar el middleware, hay que saber
CUÁL usar:
- `role.admin` (`AdminOnlyMiddleware`) — exclusivo del rol Admin, sin excepción. Usar solo para
  acciones que ningún otro rol debe poder hacer nunca (gestión de usuarios, configuración del
  negocio, categorías, borrar productos).
- `permission:xxx` (`PermissionMiddleware`) — Admin siempre pasa; los roles configurables
  (Employe/Cocina/Caja) pasan si tienen esa clave otorgada en "Roles y permisos". Usar para acciones
  que legítimamente distintos roles deben poder hacer según configuración del negocio.
- `permission:xxx,yyy` (mismo middleware, variádico) — pasa con CUALQUIERA de las claves (OR), no
  exige todas. Úsalo solo cuando dos flujos de UI *distintos* con permisos *distintos* llegan
  legítimamente al mismo endpoint (ej. TakeOrder usa `takeOrder`, QuickSale retomando una venta usa
  `viewOrders` — ambos mutan el carrito vía el mismo `OrderProductController`). No lo uses como
  atajo para "no sé cuál permiso poner"; si dudas, revisa qué permiso exige el frontend real que
  consume ese endpoint (`grep` del componente/hook en `resources/js/`) antes de decidir.
- Autorización por campo dentro de un `FormRequest::authorize()` — cuando un solo endpoint atiende
  varias intenciones distintas del frontend con permisos distintos por campo/valor (ej.
  `OrderUpdateRequest`: renombrar exige `editOrderName`, cerrar exige `payOrder`, marcar servida
  exige `kitchenView` — un solo `permission:xxx` en la ruta sería incorrecto). Ver
  `OrderUpdateRequest::authorize()` como referencia del patrón.

**Antes de decidir qué middleware poner, verifica el uso real en frontend** — no adivines ni copies
un permiso "parecido". Un middleware demasiado restrictivo rompe flujos reales en producción tan
mal como uno ausente rompe la seguridad (en esta auditoría, poner `role.admin` a ciegas en las
mutaciones de carrito hubiera roto TakeOrder para Employe y QuickSale completo para Caja).

**Al agregar una clave de permiso nueva**, actualiza los 3 lugares en sincronía (documentado también
en `RolePermissionService`):
1. Tabla `permissions` (seeder/migración).
2. `RolePermissionService::DEFAULTS` (backend — usado como fallback, ver abajo).
3. `resources/js/utils/permissionUtils.ts` → `DEFAULT_ROLE_PERMISSIONS` (frontend — debe reflejar
   exactamente lo mismo; un desfase entre ambos hace que el frontend muestre un botón que el backend
   rechaza, o viceversa).

**Rol sin `role_permissions` configurado ≠ rol sin acceso.** `RolePermissionService::grantedKeys()`
cae a `DEFAULTS` cuando el rol nunca fue configurado (ni por el Admin en "Roles y permisos" ni por el
seeding de SuperAdmin) — un tenant nuevo o un rol recién creado no debe quedar bloqueado en todo. La
tabla `role_permission_configs` es el marcador que distingue "nunca configurado" (→ DEFAULTS) de
"Admin lo configuró explícitamente a cero permisos" (→ vacío real). Si tocas `RolePermissionService`,
no rompas esta distinción — ambos estados dejan 0 filas en `role_permissions` y solo el marcador los
diferencia. Ningún flujo de creación de tenant siembra `role_permissions` automáticamente hoy
(`TenantManagementController::store()` no lo hace); no asumas que un tenant/rol nuevo tiene permisos
reales sin verificarlo.

**Tests de autorización — por cada regla nueva, escribe el par completo:**
- Positivo: el rol CON el permiso otorgado explícitamente puede hacer la acción.
- Negativo: el mismo rol SIN ese permiso (pero configurado con otro permiso cualquiera, para no caer
  en el fallback a DEFAULTS) no puede.
- Si el endpoint es compartido por dos flujos de UI con distinto permiso (patrón OR), agrega un test
  por cada permiso que legítimamente lo habilita.
- Referencia: `tests/Security/OrderProductAuthorizationTest.php`,
  `tests/Security/NewTenantPermissionsFallbackTest.php` (este último simula el flujo real de alta de
  un tenant nuevo end-to-end — usarlo como plantilla si necesitas probar otro flujo de onboarding).
- **Gotcha de testing**: si un test hace más de una request autenticada como usuarios distintos en el
  mismo método (ej. SuperAdmin crea un tenant y luego actúa como el Admin de ese tenant), el guard de
  Sanctum cachea el primer usuario resuelto y ordena el segundo bearer token — `TestCase::authHeaders()`
  ya llama `forgetGuards()` para esto, así que basta con usar `$this->authHeaders($user)` normalmente;
  no hace falta ningún workaround adicional.

**Dinero/decimales expuestos por la API — no agregues `'campo' => 'decimal:2'` a `$casts` a la
ligera.** Este proyecto no tiene capa de API Resources (los controllers hacen
`Response::success($model)` directo), así que el cast `decimal:N` de Eloquent serializa el campo como
**string** en el JSON (`"total": "150.00"`) en vez de número — rompe comparaciones estrictas del
frontend (`order.total === 0`) y los tipos `IOrder.total: number` / `IProduct.precio: number` sin dar
ningún error visible. Si una columna es `DECIMAL` en BD y necesita representarse como float en PHP
(para que la serialización JSON siga siendo numérica), usa cast `'float'` explícito — no `'decimal:N'`.
Precedente ya en el código: `ProductVariantModel::precio`, `SubscriptionModel::amount`,
`BusinessConfigModel::subscription_amount`.

**Stock por variante — recuerda que el stock puede vivir en dos niveles.** Desde el soporte de
variantes con stock propio (tallas, ej. zapatería), un producto con variantes activas y
`manage_stock=true` deja `product.stock`/`min_stock` en `null` a propósito (el stock vive en
`product_variants.stock/min_stock`). Cualquier query o cálculo nuevo sobre stock/bajo-stock debe
considerar ambos niveles (ver `ProductsService::makeQuery()` filtro `low_stock` y
`ProductModel::hasLowStock()` como referencia correcta, y su espejo en frontend
`resources/js/utils/stock.ts::isProductRowLowStock()`) — un bug real de esta clase (el filtro
"Solo stock bajo" no encontraba productos cuyo stock bajo vivía solo en sus variantes) se corrigió
en esta auditoría.

**Antes de tocar el flujo de venta/cierre de caja/descuento de stock**, revisa:
- `StockService::applyMovement()` usa `lockForUpdate()` — cualquier nuevo punto de descuento/ajuste
  de stock debe pasar por este service, nunca mutar `stock`/`min_stock` directo con `update()`.
- Evita N+1 en loops sobre líneas de carrito/orden: precarga con
  `Model::whereIn('id', $ids)->get()->keyBy('id')` antes del loop, no hagas `find()`/`where()->first()`
  por línea (ver `OrderSaleService::createDirectSale()` y `OrderCloseService::deductStockForOrder()`
  como referencia).
- Nunca agregues un `DB::transaction()` propio en un controller/service — `TransactionMiddleware` ya
  envuelve toda request no-GET con reintento en deadlock; un transaction adicional solo crea un
  savepoint innecesario.

**Manejo de errores expuestos al cliente** — nunca devuelvas `$th->getMessage()` de una excepción
capturada directo en la respuesta JSON (puede filtrar rutas de archivo, credenciales de conexión,
detalles internos). Loguea el error completo (`Log::error($th)`) y devuelve un mensaje genérico. Ver
`PrintController` (`printFailure()`) como referencia del patrón.

**Generación de credenciales — nunca derives usuario/contraseña de un patrón predecible** (rol +
slug del tenant, rol + sufijo fijo, etc.). El slug de un tenant es público (aparece en la URL del
menú público), así que cualquier patrón fijo tipo `admin-{slug}` / `admin1234` es adivinable por
fuerza bruta dirigida. Si necesitas crear una cuenta automáticamente (seeding, invitación, alta
masiva), genera una contraseña aleatoria de un solo uso y fuerza su cambio en el primer login
(flag `must_change_password` o equivalente) — nunca reutilices el mismo string derivado para todos
los tenants.

**Reportes/exports con rango de fechas — exige al menos un filtro de periodo antes de consultar.**
Un endpoint de reporte/export que permite "sin filtros = trae todo el historial del tenant" es un
riesgo de memoria/timeout que crece solo con el tiempo (cero código nuevo lo dispara, basta con que
el negocio acumule historial o que el usuario limpie los filtros por accidente). Todo endpoint
nuevo de este tipo debe validar que venga al menos un filtro de periodo (`sistema_id`, `fecha`,
`semana` o `mes`) antes de correr la query — mismo guard ya usado en
`OrderController::salesByCategory`/`exportSalesReport`. No repliques el patrón sin filtro que tenía
`ProviderPurchaseService` antes de este fix salvo que "ver todo el historial sin filtro" sea
explícitamente la funcionalidad deseada (como en el detalle de proveedor, donde limpiar filtros sí
significa "ver todo a propósito" — confirmar la intención real antes de agregar el guard a ciegas).

**Contrato de respuesta de la API — usa siempre `Response::success()`/`Response::error()`**, nunca
`response()->json([...])` crudo ni el facade `Response::json()` sin pasar por el macro del proyecto
— romper el contrato `{status, message, data}` obliga al frontend a manejar casos especiales. Presta
atención al **orden posicional de los argumentos** de `Response::success($data, $message, $httpStatus)`
— el proyecto no usa `strict_types`, así que pasar un código HTTP en la posición de `$message` (ej.
`Response::success(null, 201)`) se convierte silenciosamente a string sin error ni warning, y el
status HTTP real queda en 200 en vez del código que querías enviar.

**Comparaciones de fecha/hora contra columnas `created_at`** — las fechas en BD de este proyecto se
guardan en hora **local** (`America/Mexico_City`), no UTC. Si armas un rango con `Carbon` para un
`whereBetween('created_at', [...])`, no llames `->utc()` sobre ese rango — desplaza la ventana de
comparación por el offset de la zona horaria y produce resultados incorrectos sin ningún error
visible (así se manifestó un bug real: "Top 3 más vendidos"/"ticket promedio" del mes excluían las
primeras ~6 horas del mes e incluían las del mes siguiente). Sigue el patrón ya correcto de
`OrderService::makeQuery()`/`OrderSaleService::applyPeriod()` — `Carbon` en hora local, sin `->utc()`.

**`env()` solo en archivos de `config/*.php`.** Cualquier `env()` fuera de config deja de funcionar
en cuanto el deploy corre `php artisan config:cache` (estándar en producción) — falla en silencio,
sin error visible. Si necesitas una variable de entorno nueva en un service/controller, agrégala a
un archivo de `config/` existente o crea uno nuevo, y referencia vía `config('archivo.clave')`.

**Migraciones que tocan columnas con datos existentes (cambio de tipo, no solo agregar columna)** —
antes de correr en producción:
- Backup completo de la(s) tabla(s) afectadas.
- Verificar con sumas de control (`SUM()`/`COUNT()` antes y después) contra una copia real de los
  datos del tenant más grande, no solo contra datos de prueba.
- Correr en ventana de mantenimiento si la tabla es grande — un `ALTER TABLE ... MODIFY COLUMN` en
  MySQL puede reescribir la tabla completa y bloquear escrituras según motor/versión.
- Preferir migraciones puramente aditivas (agregar columna/tabla/índice nullable) siempre que el caso
  lo permita — son las únicas que se pueden desplegar sin ventana de mantenimiento ni riesgo de
  pérdida/alteración de datos existentes.
