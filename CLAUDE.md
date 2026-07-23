# sistema POS para negocio

Sistema POS para negocio.

---

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Laravel 12, PHP, Sanctum, Reverb (WebSocket) |
| UI | React 19 + TypeScript + Tailwind CSS |
| Estado servidor | TanStack Query v5 |
| Formularios | Formik + Yup |
| Tablas | Mantine + mantine-datatable |
| Iconos | Lucide React |
| Router | React Router v6 (lazy loading) |
| HTTP | Axios (via `useAxios` context) |
| WebSocket | Laravel Echo + pusher-js (broadcaster: reverb) |
| Notificaciones | React Toastify |
| Alertas | SweetAlert2 |
| Package manager | pnpm |

---

## Estructura del frontend (`resources/js/`)

```
resources/js/
├── app.tsx                   # Root: QueryClient, MantineProvider, ToastContainer, AxiosProvider, RouterProvider
├── main.tsx                  # Entry point
├── pages/                    # Una carpeta por feature, kebab-case
│   ├── Dashboard/
│   ├── Sales/
│   │   └── partials/         # OpenSales/, CloseSales/, SalesSummary/, SalesList/
│   ├── Category/
│   ├── Product/
│   ├── Orders/
│   └── Statistics/
├── components/               # Componentes reutilizables globales
│   └── PrivateRoute/
│   └── .../ 
├── services/                 # Hooks de TanStack Query por recurso (useXxxService.ts)
│   ├── useOrderService.ts
│   ├── useProductService.ts
│   ├── useCategoriesService.ts
│   └── ...
├── hooks/                    # Hooks genéricos
│   ├── useApi.ts             # useGET / usePOST / usePUT / useDELETE
│   ├── useAxios.tsx          # Acceso al AxiosInstance autenticado
│   ├── useDatatable.tsx
│   ├── useModal.ts
│   └── useOnSubmit.ts
├── models/                   # Interfaces de dominio (IOrder, IProduct, ICategory…)
├── enums/                    # Enums de rutas, roles, estados
│   ├── RoutesEnum.ts         # AdminRoutes (rutas frontend)
│   ├── ApiRoutesEnum.ts      # ApiRoutes (rutas API backend)
│   ├── RoleEnum.ts           # Admin = 1, Employe = 2
│   └── OrderStatusEnum.ts
├── intefaces/                # Interfaces genéricas (IPaginate, IAxiosProps…)
├── contexts/                 # AxiosContext (token de Sanctum)
├── configs/                  # axiosConfig, appConfig, apisEnum
├── router/
│   ├── routes.tsx            # createBrowserRouter
│   └── modules/
│       ├── admin.routes.tsx  # Rutas privadas con lazy()
│       ├── auth.routes.tsx
│       └── error.routes.tsx
└── types/                    # assets.d.ts
```

---

## Rutas del frontend (`RoutesEnum.ts`)

| Ruta | Página | Rol |
|---|---|---|
| `/` | Dashboard | Todos |
| `/open-sales` | Apertura de caja | Todos |
| `/close-sales` | Cierre de caja | Todos |
| `/sales-summary/:id` | Resumen de venta | Todos |
| `/sales` | Lista de ventas | Admin |
| `/orders` | Lista de órdenes | Todos |
| `/take-order/:id` | Tomar pedido | Admin |
| `/products` | Productos | Todos |
| `/product/:id` | Editar producto | Admin |
| `/categories` | Categorías | Admin |
| `/category/:id` | Editar categoría | Admin |
| `/statistics` | Estadísticas | Admin |

---

## Tipos de negocio (`BusinessTypeEnum`)

El sistema soporta múltiples tipos de negocio. El tipo activo se determina por `features` en `IBusinessFeatures` (disponible via `useAxios()`).

| Tipo | Valor | Features activos |
|---|---|---|
| Restaurante / cafetería | `restaurante` | `kitchen_view`, `order_served` |
| Venta por peso (carnicería) | `venta_por_peso` | `sell_by_weight: true`, sin kitchen_view ni order_served |

```ts
const { features } = useAxios();
const sellByWeight = features?.sell_by_weight === true;
```

### Comportamiento diferenciado `sell_by_weight`

- **Dashboard**: `RecentSales` muestra órdenes InProcess + Closed. Las InProcess son clickeables y abren `NewSaleModal` para continuar la venta.
- **Órdenes**: listado con status InProcess por defecto. Click en fila InProcess abre `NewSaleModal` (modo resume). Fila Closed muestra `SaleActions`.
- **Sidebar**: la página de Órdenes es visible para todos los tipos de negocio.
- **NewSaleModal**: flujo de venta directa con creación lazy de orden, cobro inline, y confirmación de impresión con Swal.
- **`SaleActions`** (`components/orders/SaleActions.tsx`): componente reutilizable para acciones de sell_by_weight — botón Eye (solo órdenes Closed) + `PrintTicketButton`. Usado en DataTable de Órdenes y en `RecentSales`.

---

## API Backend (prefijo `/api`)

| Recurso | Endpoints principales |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/register` |
| Categorías | `GET/POST /category`, `GET/PUT/DELETE /category/{id}`, `GET /category/{id}/product` |
| Productos | `GET/POST /product`, `GET/PUT/DELETE /product/{id}`, `POST /product/{id}/image` |
| Órdenes | `GET/POST /order`, `GET/PUT/DELETE /order/{id}`, `GET /order/{id}/total` |
| Productos en orden | `GET/POST /order/{id}/product`, `PUT/DELETE /order/{id}/product/{pid}` |
| Estado de orden | `GET/POST /order-status`, `GET/PUT /order-status/{id}` |
| Sistema (caja) | `GET /admin/system/active-sale`, `POST /admin/system/open`, `POST /admin/system/{id}/close` |
| Estadísticas | `GET /admin/system/statistics/best-seller` |
| Reporte por categoría | `GET /order/sales-by-category?sistema_id=&fecha=` — `fecha` es opcional; sin ella devuelve toda la sesión |
| Archivos | `GET /files/{file}` |

---

## Estructura del backend (`app/`)

```
app/
├── Http/
│   ├── Controllers/           # Delgados: orquestan (validan vía FormRequest, delegan a Services, responden)
│   │   ├── SuperAdmin/        # Panel SuperAdmin (gestión de tenants, suscripciones, usuarios)
│   │   └── Admin/             # Endpoints admin-only del tenant (config de negocio, etc.)
│   ├── Requests/              # FormRequest — toda validación vive aquí, nunca inline en el controller
│   └── Middleware/            # ResolveTenant, CheckSubscription, TrackActivity, SuperAdminMiddleware...
├── Services/                  # Lógica de negocio — dos patrones, ver "Backend (Laravel)" abajo
├── Models/                    # Eloquent models; constantes de columna (self::NOMBRE = 'nombre')
│   ├── Scopes/                # Global scopes (TenantScope)
│   └── Traits/                # HasTenant y otros traits compartidos
├── Enums/                     # PHP enums backed (::value), reflejados 1:1 en resources/js/enums/
├── Core/
│   ├── Paginator/DataTable.php    # Clase base de servicios de listado paginado
│   └── Data/IndexData.php         # DTO de paginación/orden/filtros (page, limit, search, orderParam, order)
└── Events/                    # Eventos broadcast (Reverb — ej. OrdersUpdated)

database/
├── migrations/                # Toda modificación de esquema pasa por aquí (ver regla en "migraciones")
├── factories/                 # {Model}Factory.php — Laravel lo resuelve por convención si el modelo usa HasFactory
└── seeders/

routes/
├── api.php                    # Agrupa middleware [auth:sanctum, ResolveTenant, check.subscription, track.activity]
│                               # y hace require de los módulos de abajo. Rutas públicas van fuera del grupo.
└── modules/
    ├── categories.php         # Un archivo por recurso — ver patrón en "Backend (Laravel)" abajo
    ├── customers.php
    ├── orders.php
    ├── superadmin.php         # Su propio grupo: auth:sanctum + SuperAdminMiddleware
    └── ...
```

---

## Reglas del proyecto

### Estructura
- Cada página vive en `pages/<Feature>/<FeaturePage>.tsx` con lazy loading en `admin.routes.tsx`.
- Componentes reutilizables de la página van en subcarpeta `partials/` dentro de la página, o en `components/` si son globales.
- Todos los componentes deben ser responsivos

### Organización de `partials/`
Cuando una carpeta `partials/` acumula más de ~6 archivos, agrupa por funcionalidad en subcarpetas:

```
partials/
├── <Funcionalidad>/      # PascalCase, agrupa componente + hook + subcomponentes
│   ├── ComponentePrincipal.tsx
│   ├── useComponentePrincipal.ts
│   └── SubComponente.tsx
└── ComponenteSolitario.tsx  # Archivos sin grupo propio se dejan al nivel de partials/
```

**Ejemplos ya aplicados:**

`pages/Dashboard/partials/`
```
NewSaleModal/    ← modal de venta + carrito + pago (8 archivos)
OpenSalesModal/  ← apertura de caja (2 archivos)
RecentOrders/    ← vista restaurante + OrderCard (2 archivos)
RecentSales/     ← vista sell_by_weight (2 archivos)
```

`pages/Orders/partials/`
```
Cart/            ← CartPanel + items + footer + hooks de pago (9 archivos)
ProductSelector/ ← ProductGrid + ProductCard + CategoryTabs + hook (4 archivos)
AddExtraModal/   ← modal de extras + hook (2 archivos)
OrderFilters.tsx ← solitario, sin carpeta propia
```

**Reglas al mover archivos:**
- Los imports internos del grupo no cambian (los archivos se mueven juntos).
- Actualizar imports en archivos externos (páginas, componentes globales) que apunten al grupo movido.
- Archivos sin consumidores detectados → eliminar en lugar de mover.
- Siempre verificar con `npx tsc --noEmit` después de cada reorganización.

### peticiones http
no hacer peticiones directamete a axios, utiliza la capa de servicios como esta declarado en services/*.ts cuando se necesita consultar el backend desde la UI

### Funciones utilitarias
- Nunca definir funciones puras (formateadores, calculadores, helpers de fecha, mapeos de dominio) directamente dentro de un componente o hook.
- Antes de crear una función nueva, revisar si ya existe en `utils/`. Archivos actuales:
  - `utils/formatCurrency.ts` — `formatCurrency`
  - `utils/formatUnits.ts` — `formatTotal`
  - `utils/dateUtils.ts` — `localDateString`, `parseDateLocal`, `formatOrderTime`, `computeExpiresAt`
  - `utils/orderStatus.ts` — `getStatusStyle`, `getStatusLabel`
  - `utils/deliveryCalc.ts` — cálculos de domicilio
  - `utils/calcWeightFromPrice.ts` — conversión peso/precio
- Si la función no existe, crearla en el archivo de utils correspondiente (o uno nuevo si no encaja en ninguno) y exportarla desde allí.
- No exportar funciones utilitarias desde hooks o componentes para ser reutilizadas — eso es señal de que deben vivir en `utils/`.

### Componentes
- Crea **componentes** en vez de funciones inline en la page.
- crea hooks si es necesario por cada componente creado para separar la logica de cada componente
- Crea componentes separados, evita crear varios componentes en un solo archivo
- No utilizar tablas con html directamente, utiliza el componente DataTable y su hook para cargar informacion
- utiliza el componente "Input" ubicado en components/ui/form/input para todos los inputs especificados, esto contiene validaciones y funcionalidades utiles

### Pages
- en la carpeta pages solo debe existir un componente el cual debe llamar componenes reutilizables ubicados en la carpeta Components/{module}/component.tsx
- crea hooks si es necesario en la carpeta de pages donde contendra la logica solo de esta pagina en especifico

### Tipos
- Definir tipos de dominio en `models/` (interfaces `IXxx`).
- Interfaces genéricas en `intefaces/` (typo original del proyecto — mantenerlo para consistencia).
- No duplicar tipos en componentes; importar desde `models/` o `intefaces/`.

### Servicios y estado del servidor
- Todos los llamados HTTP usan `useGET` / `usePOST` / `usePUT` / `useDELETE` de `hooks/useApi.ts`.
- Los servicios van en `services/useXxxService.ts`; cada archivo agrupa un recurso.
- No usar Zustand. Solo TanStack Query para estado del servidor.
- Invalidar queries con `queryClient.invalidateQueries` tras mutaciones.
- Cuando una mutación necesita un ID dinámico **en la URL** (no solo en el body), usar `useMutation` + `axiosPUT` / `axiosDELETE` directamente dentro del service, ya que `usePUT`/`useDELETE` fijan la URL en el momento de la llamada al hook.

### typescript
- Cada que se modifique una funcion existente actualiza las interfaces si es necesario para evitar errores
- revisa los errores despues de cada modificacion utilizando Lint u otra herramienta para evitar errores de typescript o errores de sintaxis.

#### `useOrderService.ts` — hooks disponibles

| Hook | Método | Endpoint |
|---|---|---|
| `useIndexOrder(params)` | GET | `/order` — lista paginada |
| `useInfiniteIndexOrder(sistemaId)` | GET | `/order` — lista infinita |
| `useShowOrder(orderId)` | GET | `/order/{id}` |
| `useStoreOrder()` | POST | `/order` |
| `useUpdateOrder(orderId)` | PUT | `/order/{id}` |
| `useDeleteOrder(orderId)` | DELETE | `/order/{id}` |
| `useIndexOrderProducts(orderId)` | GET | `/order/{id}/product` |
| `useGetProductInOrder(orderId, productId)` | GET | `/order/{id}/product/{pid}` |
| `useAddProductToOrder(orderId)` | POST | `/order/{id}/product` |
| `useUpdateProductInOrder(orderId)` | PUT | `/order/{id}/product/{pid}` — recibe `{ productId, data }` |
| `useDeleteProductInOrder(orderId)` | DELETE | `/order/{id}/product/{pid}` — recibe `productId` |
| `useIndexPrintOrder(orderId)` | POST | `/order/{id}/print` |

#### `useSalesByCategoryService.ts`

```ts
useSalesByCategory(sistemaId: number | null, fecha?: string | null)
```
- Sin `fecha`: devuelve toda la sesión (uso en CloseSales).
- Con `fecha`: filtra por día (uso en SalesPage → "Reporte por categoría").

#### `useSalesByCategoryModal.ts`

```ts
useSalesByCategoryModal(fecha?: string | null)
```
Acepta `fecha` opcional. En `SalesPage` se pasa la fecha del filtro activo; en `CloseSales` se llama sin argumento.

#### Patrón para operaciones con doble-click / requests lentos

Cuando un botón dispara una mutación que puede tardar, usar el patrón `useRef` + `useState` para evitar requests duplicados y deshabilitar el botón mientras está en vuelo:

```ts
const pendingRef = useRef(new Set<number>());
const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());

const toggle = async (id: number) => {
    if (pendingRef.current.has(id)) return;
    pendingRef.current.add(id);
    setPendingIds(new Set(pendingRef.current));
    try {
        await mutate(id);
    } finally {
        pendingRef.current.delete(id);
        setPendingIds(new Set(pendingRef.current));
    }
};
```

`useRef` actúa como guard síncrono (sin esperar re-render); `useState` actualiza la UI. Implementado en `useOrderPreviewModal` y `useTakeOrder`.

### Estilos
- Tailwind CSS + CSS variables del proyecto (`resources/css/`). No inventar colores fuera del design system.
- No usar `style={{}}` inline; usar clases Tailwind.
- Bootstrap está en el proyecto pero **preferir Tailwind** en código nuevo.

### Formularios
- Formik + Yup para validación. No construir formularios controlados manualmente.

### Iconos
- Exclusivamente `lucide-react`. No usar bootstrap-icons en código nuevo.

### Router
- Rutas privadas usan `PrivateRoute`. Permisos por rol via `hasPermission` en `admin.routes.tsx`.
- Siempre agregar nuevas rutas en `RoutesEnum.ts` y en `router/modules/admin.routes.tsx`.

### HTTP / Auth
- El token de Sanctum se inyecta vía `AxiosContext`. Usar siempre `useAxios()` — nunca crear una instancia de axios directo.

### Convenciones de nombres
- Archivos de página: `PascalCase` (`OrderListPage.tsx`).
- Hooks/servicios: `camelCase` con prefijo `use` (`useOrderService.ts`).
- Enums: `PascalCase` con sufijo `Enum` (`RoutesEnum.ts`).
- Interfaces: prefijo `I` (`IOrder.ts`).

### variables
- utiliza variables en ingles

### migraciones
- utiliza nombres en ingles a nuevas columnas en las migraciones
- todas las nuevas columnas deben ser agregadas por migracion
- las columnas que se deban borrar, deben ser borradas por migraciones
- toda modificacion a la base de datos es mediante una migracion

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
---

## Decisiones de arquitectura relevantes

### `delivery_paid_by` eliminado
El campo `delivery_paid_by` fue removido de `business_config` (migración `2026_07_07_151043_drop_delivery_paid_by_from_business_config_table`). El modo de pago del domicilio ahora lo selecciona el usuario en cada venta dentro de `NewSaleModal` — no es una configuración global del negocio. El backend defaultea internamente a `"customer"`.

### Página de Ventas — solo órdenes Closed (status 3)
`SalesPage` filtra exclusivamente `estatus_pedido_id: Closed`. Las órdenes InProcess viven en `OrderListPage`. No se envía `sistema_id` porque es una vista histórica que puede consultar fechas de sesiones anteriores.

### `OrderPreviewModal` — botón disparador deshabilitado
El botón Eye que abre el modal se deshabilita cuando `order.total === 0`. Aplica en Dashboard (`RecentSales`), Órdenes (`OrderActionGroup`) y Ventas (`actionsColumn` de `useSalesPage`).

### Agente de impresión (`printer_enabled`)
El agente de impresión es un proceso local del cliente que recibe bytes ESC/POS vía WebSocket en `localhost:8765` (repo: `sfadiego/printer-agent`). Su nombre de impresora se configura en el `config.json` del ejecutable, no en el panel admin.

`printer_enabled` en `business_config` controla por cliente si el `PrintAgentProvider` se conecta y si la sección de impresora es visible en el panel admin. Se gestiona exclusivamente desde el SuperAdmin.

La variable `VITE_APP_ENV` en el `.env` actúa como override para desarrollo:

```
# .env local
VITE_APP_ENV=local   → agente siempre activo, sección visible sin importar printer_enabled

# .env producción
VITE_APP_ENV=production → agente activo solo si SuperAdmin habilitó printer_enabled para ese cliente
```

**⚠️ Variable requerida en producción:** `VITE_APP_ENV=production` debe estar en las variables de entorno de build (Dockerfile ARGs o CI/CD). Sin ella el valor es `undefined` y la condición falla silenciosamente.

Lógica en frontend:
```ts
// AppLayout.tsx
enabled={import.meta.env.VITE_APP_ENV === "local" || !!config?.printer_enabled}

// AdminPage.tsx
const printerVisible = import.meta.env.VITE_APP_ENV === "local" || config?.printer_enabled === true;
```
### Testing
- Los test se van a crear para probar las apis existentes en `php artisan route:list`
- no crear funciones nuevas para crear archivos, utiza factory en los metodos que lo requieran

### PHP — imports y referencias de clases
- Nunca referenciar clases con el namespace completo inline (ej. `\App\Models\ErrorReporting::where(...)`). Siempre declarar el `use` al inicio del archivo y usar solo el nombre corto (ej. `use App\Models\ErrorReporting;` → `ErrorReporting::where(...)`).
- Esto aplica en controladores, servicios, tests y cualquier archivo PHP.
