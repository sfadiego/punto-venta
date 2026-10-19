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

### Contextos: globales vs. de página

- `contexts/` — exclusivo para contextos globales accesibles en toda la app (ej. AxiosContext, LayoutContext). No agregar aquí contextos de features específicas.
- Contextos de página — viven en `pages/<Feature>/` junto al hook de la página, nombrados `<Feature>Context.tsx`. Envuelven solo esa página y desaparecen al navegar fuera.

Patrón de contexto de página:
- `<Feature>Context.tsx` declara el contexto, el Provider y el hook `use<Feature>Context()`.
- El Provider envuelve el componente raíz de la página.
- Los partials en `pages/<Feature>/partials/` consumen `use<Feature>Context()` directamente.

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
| `/branches` | Administración de sucursales | Admin (permiso `manageBranches`) |

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
| Devoluciones (retail) | `POST /order/{id}/return` (permiso `processReturns` + `retail.stock`), `POST /order/{id}/return/{orderReturn}/print` y `GET .../print/bytes` (permiso `printTicket`) — ver "Devoluciones de venta" |
| Cajón de dinero | `POST /order/cash-drawer` (permiso `payOrder`; solo impresora de servidor) — ver "Cajón de dinero" |
| Estado de orden | `GET/POST /order-status`, `GET/PUT /order-status/{id}` |
| Sistema (caja) | `GET /admin/system/active-sale`, `POST /admin/system/open`, `POST /admin/system/{id}/close` |
| Estadísticas | `GET /admin/system/statistics/best-seller` |
| Reporte por categoría | `GET /order/sales-by-category?sistema_id=&fecha=&branch_id=` — `fecha` y `branch_id` son opcionales |
| Sucursales (tenant Admin) | `GET /branch/list` (autorizadas para el usuario, cualquier rol), `GET /branch`, `POST /branch`, `GET/PUT/DELETE /branch/{id}`, `PUT /branch/{id}/users` (todo `role.admin`) |
| Sucursales (SuperAdmin) | `GET/POST /super-admin/tenant/{tenant}/branches`, `PUT /super-admin/tenant/{tenant}/branches/{branch}`, `POST /super-admin/tenant/{tenant}/branches/enable`, `PATCH /super-admin/tenant/{tenant}/branches/{branch}/toggle` |
| Sucursales de un usuario | `GET/PUT /admin/users/{user}/branches` (tenant), `GET/PUT /super-admin/tenant/{tenant}/users/{user}/branches` (SuperAdmin) |
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

### Reglas esenciales (el detalle vive en las skills del final)
- **HTTP**: nunca llamar axios directo, ni en componentes ni en hooks de `pages/**`; siempre vía `services/useXxxService.ts` (TanStack Query). No usar Zustand.
- **Componentes**: uno por archivo, con su hook para la lógica; tablas con `DataTable`, inputs con `components/ui/form/input`, `<Select>` siempre envuelto en un `SelectXxx`. Funciones puras en `utils/`, nunca dentro de componentes o hooks.
- **Estilos e iconos**: Tailwind (sin `style={{}}` inline) e iconos solo de `lucide-react`.
- **Formularios**: Formik + Yup; validación solo en Yup y `noValidate` en todo `<form>`.
- **Layouts responsivos**: un componente con estado o fetching se monta una sola vez; no duplicarlo en `hidden`/`lg:hidden`.
- **TypeScript**: tras cada cambio, revisar errores (`npx tsc --noEmit` o lint) y actualizar las interfaces afectadas.
- **Backend**: controllers delgados, validación en FormRequest, lógica en Services, respuestas con `Response::success()`/`Response::error()`.
- **Transacciones**: no usar `DB::transaction()`; las maneja `TransactionMiddleware`.
- **Multi-tenancy**: modelos con `HasTenant`; `exists:`/`unique:` deben filtrar por `tenant_id`.
- **Rutas nuevas**: declarar siempre su nivel de acceso (`role.admin` o `permission:xxx`); ver `seguridad-endpoints`.
- **`env()`** solo dentro de `config/*.php`.

### Convenciones de nombres
- Archivos de página: `PascalCase` (`OrderListPage.tsx`).
- Hooks/servicios: `camelCase` con prefijo `use` (`useOrderService.ts`).
- Enums: `PascalCase` con sufijo `Enum` (`RoutesEnum.ts`).
- Interfaces: prefijo `I` (`IOrder.ts`).

### variables
- utiliza variables en ingles

### enums — nunca strings/valores literales
- Si un valor (tipo, razón, estatus, rol, etc.) ya tiene un enum backing en `app/Enums/` (PHP) o `enums/` (TS), nunca
  comparar, asignar o hacer aserciones contra su string/valor crudo (`'exit'`, `'sale'`, `3`, etc.) — siempre referenciar
  el caso del enum (`StockMovementTypeEnum::Exit->value`, `OrderStatusEnum.Closed`).
- Aplica también en tests: `assertDatabaseHas`, `assertJsonPath`, payloads de request, etc. deben usar el enum en vez
  del literal, para que un rename del valor del enum rompa la referencia en compilación/lint en vez de fallar en
  silencio en runtime.
- Si el valor no tiene enum todavía y se repite en más de un lugar, crear el enum correspondiente antes de seguir
  usando el literal.

### migraciones
- utiliza nombres en ingles a nuevas columnas en las migraciones
- todas las nuevas columnas deben ser agregadas por migracion
- las columnas que se deban borrar, deben ser borradas por migraciones
- toda modificacion a la base de datos es mediante una migracion

## Decisiones de arquitectura relevantes

### `delivery_paid_by` eliminado
El campo `delivery_paid_by` fue removido de `business_config` (migración `2026_07_07_151043_drop_delivery_paid_by_from_business_config_table`). El modo de pago del domicilio ahora lo selecciona el usuario en cada venta dentro de `NewSaleModal` — no es una configuración global del negocio. El backend defaultea internamente a `"customer"`.

### Página de Ventas — solo órdenes Closed (status 3)
`SalesPage` filtra exclusivamente `estatus_pedido_id: Closed`. Las órdenes InProcess viven en `OrderListPage`. No se envía `sistema_id` porque es una vista histórica que puede consultar fechas de sesiones anteriores.

### `OrderPreviewModal` — botón disparador deshabilitado
El botón Eye que abre el modal se deshabilita cuando `order.total === 0`. Aplica en Dashboard (`RecentSales`), Órdenes (`OrderActionGroup`) y Ventas (`actionsColumn` de `useSalesPage`).

### Testing
- Los test se van a crear para probar las apis existentes en `php artisan route:list`
- no crear funciones nuevas para crear archivos, utiza factory en los metodos que lo requieran

### PHP — imports y referencias de clases
- Nunca referenciar clases con el namespace completo inline (ej. `\App\Models\ErrorReporting::where(...)`). Siempre declarar el `use` al inicio del archivo y usar solo el nombre corto (ej. `use App\Models\ErrorReporting;` → `ErrorReporting::where(...)`).
- Esto aplica en controladores, servicios, tests y cualquier archivo PHP.

---

## Skills del proyecto (`.claude/skills/`)

Se cargan solas según la tarea, o a mano con `/nombre`.

- [frontend-react](.claude/skills/frontend-react/SKILL.md) — páginas, partials, hooks, servicios, selectores, formularios y layouts responsivos.
- [backend-laravel](.claude/skills/backend-laravel/SKILL.md) — controllers, services, FormRequests, rutas, factories y multi-tenancy.
- [seguridad-endpoints](.claude/skills/seguridad-endpoints/SKILL.md) — checklist de autorización, permisos, reportes, errores y migraciones con datos.
- [multi-sucursal](.claude/skills/multi-sucursal/SKILL.md) — feature `multi_branch_enabled`, `branch_id`, `user_branch`.
- [devoluciones-venta](.claude/skills/devoluciones-venta/SKILL.md) — devoluciones retail, reembolsos, caja y reportes netos.
- [impresion-cajon](.claude/skills/impresion-cajon/SKILL.md) — agente de impresión, tickets ESC/POS y cajón de dinero.
