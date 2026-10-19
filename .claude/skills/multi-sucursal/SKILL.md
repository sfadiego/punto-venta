---
name: multi-sucursal
description: "Feature multi_branch_enabled del POS. Usar al trabajar con sucursales, branch_id, user_branch, BranchModel, SelectBranch, BranchSelectionGate, pagina /branches o activacion desde SuperAdmin."
---

# Multiples sucursales

## Múltiples sucursales (feature `multi_branch_enabled`)

Feature opt-in por tenant: cada negocio puede operar con una sola sucursal implícita (comportamiento
por defecto, sin cambios de flujo) o activar soporte multi-sucursal explícitamente.

### Decisiones de diseño
- **Stock compartido**: no existe stock por sucursal. `branch_id` en `product`/`product_variants` es
  solo una etiqueta de "en qué sucursal se dio de alta/se vende este producto" — no aísla inventario.
- **Caja independiente por sucursal**: `main_order_report.branch_id` sí aísla — una sucursal no ve ni
  afecta la caja de otra. Reportes/estadísticas filtran por `branch_id` cuando se especifica.
- **Clientes a crédito son del negocio completo**, no por sucursal — sin `branch_id`.
- **Acceso de usuario a sucursales**: tabla pivote `user_branch` (`branch_id`, `user_id`, `tenant_id`
  explícito porque la tabla no usa `HasTenant`, ver nota abajo). El Admin del tenant siempre tiene
  acceso a todas las sucursales sin necesidad de fila en el pivote (`User::authorizedBranchIds()`/
  `canAccessBranch()` hacen bypass para Admin). Otros roles solo ven/operan las sucursales que el
  Admin les otorgó explícitamente.
- **Activación exclusiva de SuperAdmin**: igual criterio de gobierno que `printer_enabled` — ni el
  Admin del tenant ni ningún otro rol puede activar `multi_branch_enabled` ni crear las sucursales
  iniciales por su cuenta (`BranchActivationService::enable()`, disparado solo desde
  `SuperAdmin\TenantBranchController::enable()`). El tenant Admin sí administra el día a día de
  sucursales ya creadas (renombrar, activar/desactivar, asignar usuarios) vía `/branch/*`.
- **Migración de datos al activar**: `BranchActivationService::enable()` crea una sucursal "Principal"
  y reasigna a ella todo `product`/`product_variants`/`main_order_report` con `branch_id` nulo del
  tenant — corre con `withoutGlobalScopes()` + `tenant_id` explícito en cada query (nunca
  `app('tenant_id')`) porque se dispara desde SuperAdmin, donde `ResolveTenant` no corrió y ese
  binding no existe.

### Guards de desactivación/eliminación (`BranchModel::deactivationBlockReason()`)
Una sucursal no puede desactivarse ni eliminarse si:
1. Tiene una caja abierta ahora mismo (`hasOpenCashRegister()`).
2. Es la única sucursal activa del tenant (`isOnlyActiveBranch()`).

Este método centraliza el guard — se llama desde `BranchesController::update()`/`delete()` (tenant) y
`TenantBranchController::toggleActive()` (SuperAdmin); antes estaba duplicado en los 3 call sites.

### Login bloqueado sin sucursal asignada
Si el tenant tiene `multi_branch_enabled` y el usuario (no-Admin) no tiene ninguna fila en
`user_branch`, `AuthService::attempt()` revoca el token recién emitido y responde con el código
`NO_BRANCH_ASSIGNED` (`ApiErrorCodeEnum.NoBranchAssigned` en frontend) — el formulario de login
muestra un banner inline sobre el form (no un toast) en vez de dejarlo entrar sin poder operar nada.

### Frontend
- **`SelectBranch`** (`components/SelectBranch.tsx`): wrapper genérico `<T,>` sobre `Select`, sigue el
  patrón `SelectXxx` del proyecto. Soporta modo `formik` (apertura de caja, formulario de producto) o
  controlado `value`/`onChange` (filtros de listado). Opciones resueltas de `useBranchList()` (solo
  sucursales activas y autorizadas para el usuario autenticado).
- **`branchId` en `AxiosContext`**: la sucursal activa se persiste en `localStorage`, se limpia en
  logout y también si deja de ser válida (sucursal desactivada o el usuario pierde acceso a ella —
  `AppLayout` corre un `useEffect` que detecta esto y llama `setBranch(null)`).
- **`BranchSelectionGate`**: bloquea el post-login pidiendo elegir sucursal cuando el usuario tiene
  acceso a 2+ sucursales y ninguna seleccionada todavía. Con exactamente 1 sucursal autorizada, se
  autoselecciona sin mostrar el picker.
- **Página `/branches`** (`pages/Branches/`): exclusiva del Admin del tenant (permiso
  `manageBranches`, gate en `permissionUtils.ts`), gestiona sucursales ya creadas por SuperAdmin.
  `manageBranches` está excluido intencionalmente de la UI de "Roles y permisos" delegables — el
  backend lo protege con `role.admin` puro (no `permission:xxx`), así que delegarlo desde ahí no
  tendría efecto real.
- **Panel SuperAdmin** (`components/SuperAdmin/Tenants/TenantBranchesSection/`): activa la feature,
  crea/edita sucursales, alterna activo/inactivo — usa modal con `createPortal` para evitar el
  `<form>` anidado dentro del form de edición de tenant.

### Nota: `user_branch` no usa `HasTenant`
Es una tabla pivote pura (sin modelo Eloquent propio) — cualquier `sync()`/`attach()` debe pasar
`tenant_id` explícito como dato de pivote (`$branch->users()->sync([$userId => ['tenant_id' =>
$branch->tenant_id]])`), o la inserción falla contra la restricción `NOT NULL` de la columna.
