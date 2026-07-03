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
| Archivos | `GET /files/{file}` |

---

## Reglas del proyecto

### Estructura
- Cada página vive en `pages/<Feature>/<FeaturePage>.tsx` con lazy loading en `admin.routes.tsx`.
- Componentes reutilizables de la página van en subcarpeta `partials/` dentro de la página, o en `components/` si son globales.
- Todos los componentes deben ser responsivos

### peticiones http
no hacer peticiones directamete a axios, utiliza la capa de servicios como esta declarado en services/*.ts cuando se necesita consultar el backend desde la UI

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