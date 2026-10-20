---
name: frontend-react
description: "Reglas de frontend React/TypeScript del POS. Usar al crear o modificar paginas, partials, componentes, hooks, servicios TanStack Query, selectores Select, formularios Formik/Yup, layouts responsivos o tipos en resources/js."
---

# Reglas de frontend (React + TypeScript)

### Organización de `partials/`
Cuando una carpeta `partials/` (o un grupo de funcionalidad dentro de ella) acumula más de ~6 archivos, agrupa por funcionalidad en subcarpetas. La regla es recursiva: un grupo que ya vive en su propia carpeta (ej. `SellByWeightSaleModal/`) y sigue creciendo se subdivide igual, por sub-funcionalidad dentro de ese grupo:

```
partials/
├── <Funcionalidad>/      # PascalCase, agrupa componente + hook + subcomponentes
│   ├── ComponentePrincipal.tsx
│   ├── useComponentePrincipal.ts
│   ├── SubComponente.tsx
│   └── <SubFuncionalidad>/   # si <Funcionalidad>/ a su vez crece >~6 archivos, se subdivide igual
│       ├── ComponenteHijo.tsx
│       └── useComponenteHijo.ts
└── ComponenteSolitario.tsx  # Archivos sin grupo propio se dejan al nivel de partials/
```

**Ejemplos ya aplicados:**

`pages/Dashboard/partials/`
```
SellByWeightSaleModal/  ← modal de venta por peso (16 archivos), sub-agrupado:
├── Cart/              ← CartPanel + item + footer + hook (4 archivos)
├── PayModal/           ← modal de pago + selector de método + sección de efectivo (4 archivos)
├── CustomerCredit/     ← picker de cliente a crédito + búsqueda + alta inline (4 archivos)
├── SellByWeightSaleModal.tsx  ← orquestador, solitario
├── useSellByWeightSaleModal.ts ← hook principal, solitario
├── NewSaleModalHeader.tsx      ← solitario
└── NewSaleProductPanel.tsx     ← solitario
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
- No hacer peticiones directamente a axios, utiliza la capa de servicios como esta declarado en `services/*.ts` cuando se necesita consultar el backend desde la UI.
- Esto aplica también a los hooks de lógica dentro de `pages/**` (ej. `usePageName.ts`, `use<Feature>Modal.ts`): nunca llamar `axiosPOST`, `axiosPUT`, `axiosDELETE`, `axiosGET` ni el `axiosApi` crudo de `useAxios()` directamente ahí. Si el servicio que necesitas no existe, créalo en `services/useXxxService.ts` siguiendo el patrón existente en vez de hacer la petición inline.
- Ejemplo — en vez de:
  ```ts
  await axiosPUT(axiosApi, {
      url: `${ApiRoutes.Orders}/${oid}/product/${item.orderProductId}`,
      data: { cantidad: 1, precio: price },
  });
  ```
  crear/usar un hook de servicio:
  ```ts
  // services/useOrderService.ts
  export const useUpdateOrderProduct = () => {
      const { axiosApi } = useAxios();
      return useMutation({
          mutationFn: ({ orderId, orderProductId, data }: { orderId: number; orderProductId: number; data: Record<string, unknown> }) =>
              axiosPUT(axiosApi, { url: `${url}/${orderId}/product/${orderProductId}`, data }),
      });
  };

  // en el hook de la page
  const { mutateAsync: updateOrderProduct } = useUpdateOrderProduct();
  await updateOrderProduct({ orderId: oid, orderProductId: item.orderProductId, data: { cantidad: 1, precio: price } });
  ```
- Si el ID va fijo en la URL y se conoce al montar el componente, usar directamente `usePUT`/`usePOST`/`useDELETE` de `hooks/useApi.ts` (ver ejemplo de `useUpdateCategory` en "Servicios y estado del servidor"). Si el ID es dinámico o se crea de forma lazy en medio del flujo (la orden no existe hasta el primer producto agregado, por ejemplo), seguir el patrón de `useMutation` + `axiosPOST`/`axiosPUT`/`axiosDELETE` dentro del service, pasando el ID en las variables del `mutate`/`mutateAsync` (ver `useUpdateOrderData`, `useCreateOrderProduct`, `useUpdateOrderProduct`, `useDeleteOrderItem` en `useOrderService.ts`).

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

### Selectores (`<Select>` con opciones fijas)
Nunca declarar un `<Select options={...}>` inline con un array de opciones armado en el archivo que lo usa (ya sea derivado de un enum/labels o hardcodeado). Envolver siempre `components/ui/form/Select` en un componente propio con las opciones ya resueltas — patrón `SelectBusinessType` (`components/SuperAdmin/Tenants/Sections/SelectBusinessType.tsx`):

```tsx
interface SelectXxxProps<T> {
    name: Extract<keyof T, string>;
    formik?: FormikProps<T>;       // omitir si el selector se usa controlado (value/onChange) en vez de Formik
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export const SelectXxx = <T,>({ name, formik, label, disabled, className }: SelectXxxProps<T>) => (
    <Select<T> name={name} options={XXX_OPTIONS} formik={formik} label={label} disabled={disabled} className={className} />
);
```

- Aplica tanto si las opciones salen de un enum/labels (`Object.entries(XXX_LABELS).map(...)`) como si van hardcodeadas — en ambos casos el array de opciones vive dentro del wrapper, no en el componente que lo consume.
- Si el selector se usa controlado (`value`/`onChange`, sin Formik — ej. filtros de listado) en vez del modo `formik`, omitir la prop `formik` de la interfaz y exponer `value`/`onChange` en su lugar (ver `SelectProviderActiveFilter` en `pages/Providers/partials/`).
- Ubicación del archivo: junto al/los componente(s) que lo consumen (`partials/` de la page, o la carpeta del componente si es fuera de `pages/`) — no hace falta que el selector se reutilice en más de un lugar para justificar el wrapper.
- Ejemplos ya aplicados: `SelectBusinessType`, `SelectDemoRequestStatus` y `SelectSubscriptionPlan` (`components/SuperAdmin/DemoRequests/` y `components/SuperAdmin/Subscriptions/`), `SelectBusinessNiche` (`pages/Auth/partials/`), `SelectProviderActiveFilter` (`pages/Providers/partials/`), `SelectSubscriptionFilter` (`pages/SuperAdmin/Subscriptions/partials/`) y `SelectTenantFilter` (`pages/SuperAdmin/Tenants/partials/`) — estas dos últimas son la variante controlada que combina dos estados en un único valor codificado con prefijos; también reemplazan un `<select>` HTML crudo por el componente `Select` compartido.

### Pages
Cada página vive en `pages/<Feature>/` y contiene exactamente:
- `<Feature>Page.tsx` — componente raíz. Solo orquesta: llama al hook o Provider y renderiza los partials. Sin lógica ni JSX de detalle propio.
- `use<Feature>Page.ts` — hook principal de la página. Si crece, se divide en sub-hooks dentro de la misma carpeta.
- `<Feature>Context.tsx` — solo si la página usa el patrón de contexto.
- `partials/` — componentes visuales de la página, siguiendo las reglas de partials ya documentadas.

Componentes reutilizables entre páginas van en `components/`.

### Cuándo dividir un componente de página en `partials/`
Señales de que un `<FeaturePage>.tsx` ya debe partirse (no esperar a que "se sienta grande"):
- Supera ~120-150 líneas de JSX.
- Mezcla 2+ secciones visuales independientes (ej. panel de branding + formulario A + formulario B + estado de éxito), cada una con su propio bloque de JSX que podría leerse sin ver el resto.
- Tiene un estado condicional (`submitted ? ... : ...`) donde cada rama es un bloque grande — cada rama es candidata a su propio componente.

Al dividir:
- Cada sección independiente pasa a `partials/<NombreSeccion>.tsx`. El flujo de datos depende de dónde vive el componente:
  - Partials en `components/` reciben sus datos exclusivamente por props — son globales y deben ser portables y testeables en aislamiento.
  - Partials en `pages/<Feature>/partials/` pueden consumir el contexto de su página (`use<Feature>Context`) directamente. El contexto se declara junto al hook de la página, envuelve solo esa página, y desaparece al navegar fuera. Si un partial de `partials/` se promueve a `components/`, se migra a props en ese momento.
- Si una sección tiene su propio tipo de formulario (Formik), exportar el tipo de valores desde el hook de la página (`export type <Nombre>Form = {...}`) e importarlo en el partial para tipar `FormikProps<...>` — no redefinir el shape en el componente.
- Constantes puramente locales a una sección (ej. `FEATURES`, `NICHE_OPTIONS`) se quedan en el archivo del partial que las usa, no en la page.
- La page resultante solo debe: llamar al hook, y renderizar los partials pasando props — sin lógica ni JSX de detalle propio.

**Ejemplo aplicado — `pages/Auth/`:**
```
AuthPage.tsx              ← orquestador: llama useAuthPage() y arma el layout
useAuthPage.ts             ← lógica + exporta el tipo DemoRequestForm
partials/
├── BrandingPanel.tsx      ← columna izquierda de marca (estático)
├── ClientAccessForm.tsx   ← form de slug para clientes existentes
├── DemoRequestForm.tsx    ← form de solicitud de demo (Formik + Select de giro)
└── DemoRequestSuccess.tsx ← estado de confirmación tras enviar
```

### Cuándo dividir un hook

Señales de que un hook debe partirse en sub-hooks:
- Exporta más de ~10 valores.
- Supera ~80 líneas de lógica.
- Mezcla 2+ dominios independientes (ej. carrito + balanza + pagos en un solo hook).

Al dividir:
- Crear un sub-hook por dominio en la misma carpeta (`useCart.ts`, `usePayment.ts`, etc.).
- El hook principal los compone y re-exporta: `const cart = useCart(); const payment = usePayment(); return { ...cart, ...payment }`.
- Los sub-hooks no se importan directamente desde componentes — solo el hook principal los orquesta.

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

### Layouts responsivos con componentes con estado

**Nunca dupliques el JSX de un componente con estado/fetching propio en dos contenedores `hidden lg:.../lg:hidden` (o `md:`/`sm:` equivalentes) para simular "layout mobile vs desktop".** Las clases `hidden`/`lg:hidden` de Tailwind solo aplican `display:none` — no desmontan el componente. Si el mismo `<Componente />` aparece en dos posiciones del árbol (aunque sea la misma variable JSX reutilizada), React monta **dos instancias reales**, cada una con su propio estado de hooks (`useState`, queries, debounce, paginación) — completamente desincronizadas entre sí. Bug real que causó esto: `TakeOrderPage.tsx` renderizaba `<ProductGrid />` una vez para el layout desktop (`hidden lg:flex`) y otra para el layout mobile (`lg:hidden`); cada instancia tenía su propia búsqueda/categoría activa (estado interno de `useProductGrid`), así que cambiar el ancho de la ventana mostraba una categoría de producto distinta a la que el usuario había elegido, además de duplicar peticiones de productos cuando ambos estados divergían.

- Si el componente **no tiene estado propio ni hace fetching** (un header, una barra de tabs, un texto que se oculta en mobile), renderizarlo dos veces con `hidden`/`lg:hidden` es seguro — es solo CSS, sin costo de estado duplicado (ver `QuickSaleHeader.tsx`).
- Si el componente **sí tiene estado propio o hace fetching** (listas con filtros, grids con paginación/búsqueda, carritos), móntalo **una sola vez** y reposiciónalo con CSS en el contenedor que lo envuelve — patrón ya aplicado en `QuickSaleContent.tsx` y `TakeOrderPage.tsx`:
  ```tsx
  const productGrid = <ProductGrid ... />;   // una sola instancia

  <div className={`... ${showProducts ? "" : "hidden lg:block"}`}>{productGrid}</div>
  <div className={`... ${showProducts ? "hidden lg:flex" : ""}`}>{cartPanel}</div>
  ```
  Para el wrapper de pantalla completa en mobile, usar `fixed inset-0 z-10 ... lg:static lg:z-auto` en vez de dos `<div>` raíz separados (uno `hidden lg:flex`, otro `lg:hidden fixed inset-0`) — mismo componente, misma instancia, solo cambia su posicionamiento en el viewport.

### Estilos
- Tailwind CSS + CSS variables del proyecto (`resources/css/`). No inventar colores fuera del design system.
- No usar `style={{}}` inline; usar clases Tailwind.
- Bootstrap está en el proyecto pero **preferir Tailwind** en código nuevo.

### Formularios
- Formik + Yup para validación. No construir formularios controlados manualmente.
- Toda validación de campos (rangos, formato, enteros vs. decimales, requeridos, etc.) vive en el schema de Yup — nunca depender de la validación nativa del navegador (atributos HTML `min`/`max`/`step`/`required`/`pattern` en el `<input>`). El navegador dispara su propio popup ("Please select a valid value...") al hacer submit si el `<form>` no tiene `noValidate`, lo cual bypassa el mensaje de error de Yup/Formik y muestra un tooltip nativo en inglés fuera del design system. Todo `<form onSubmit={formik.handleSubmit}>` debe llevar `noValidate`. Los atributos `min`/`max`/`step` en `Input` (`components/ui/form/input`) son solo un hint visual para las flechitas del spinner — no reemplazan la regla de Yup.

### Iconos
- Exclusivamente `lucide-react`. No usar bootstrap-icons en código nuevo.

### Router
- Rutas privadas usan `PrivateRoute`. Permisos por rol via `hasPermission` en `admin.routes.tsx`.
- Siempre agregar nuevas rutas en `RoutesEnum.ts` y en `router/modules/admin.routes.tsx`.

### HTTP / Auth
- El token de Sanctum se inyecta vía `AxiosContext`. Usar siempre `useAxios()` — nunca crear una instancia de axios directo.
