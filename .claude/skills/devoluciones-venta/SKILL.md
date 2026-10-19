---
name: devoluciones-venta
description: "Devoluciones de venta (retail) del POS. Usar al trabajar con devoluciones, reembolsos, OrderReturnService, order_returns, return_days, motivos de devolucion, caja y reportes netos de devoluciones o el comprobante de devolucion."
---

# Devoluciones de venta (retail)

## Devoluciones de venta (retail)

Devolver productos de una venta cerrada, con motivo, destino de la pieza y reembolso. Exclusivo de retail con
stock activo. Fases 1 y 2 implementadas; **pendientes**: saldo a favor del cliente (fase 3) y cambio por otro
producto (fase 4) — hoy un cambio es una devolución más una venta nueva por separado.

### Acceso
- Endpoint único `POST /order/{order}/return` (`OrderReturnController` → `OrderReturnService::create`), con
  `permission:processReturns` + `retail.stock`. `processReturns` sustituyó a `manageStock` para devolver (la
  migración se lo dio a los roles que ya tenían `manageStock`); default en Caja, solo retail. Se sincroniza en los
  3 lugares de siempre (tabla `permissions`, `RolePermissionService::DEFAULTS`, `permissionUtils.ts`).
- Dos entradas al mismo panel y endpoint: la pestaña **Devolución** de Inventario (busca la orden; exige además
  `manageStock` para llegar a la página y a `GET /order/closed-list`) y el botón **Devolver productos** del detalle
  de una venta (`OrderReturnButton`, orden ya elegida; se deshabilita si ya se devolvió todo).
- Solo órdenes `Closed`. Plazo: `business_config.return_days` (por defecto **10 días**; 0 = sin límite) contado desde
  `order.closed_at` (lo fija `OrderModel::booted()` al pasar a Closed, sea cual sea el flujo). Aplica a **todos los
  roles, Admin incluido**: pasado el plazo el botón «Devolver productos» se deshabilita (`utils/returnWindow.ts`, espejo
  de `OrderReturnStoreRequest::returnWindowError()`), la pestaña de Inventario muestra el aviso en vez del formulario y
  el backend responde 400. Para quitar el límite se configura en 0 (Admin → Devoluciones).

### Modelo de datos
- `order_returns` (cabecera: motivo, nota, `refund_amount`, `balance_applied`, `refund_payment_method_id`,
  `sistema_id`, quién) y `order_return_items` (línea `order_product_id`, cantidad, `refund_amount`).
- Los movimientos de stock siguen referenciando la **línea** (`reference` = `OrderProductModel`, `reason = return`)
  y llevan `order_return_id` para agruparlos. El máximo devolvible de una línea es `cantidad − Σ movimientos
  return`; la merma (`loss`) **no** cuenta como devuelta. Las devoluciones anteriores a la fase 1 no tienen cabecera
  ni monto: se muestran como tarjetas sin motivo y no se descuentan de reportes.
- Los métodos de pago son **globales** (`payment_methods` no tiene `tenant_id`): no filtrarlos por tenant en validaciones.

### Reglas de `OrderReturnService::create`
- Todo o nada (transacción del middleware): si una línea excede lo devolvible no se devuelve ninguna. Bloquea las
  líneas en orden de id (evita deadlocks) y precarga lo ya devuelto/reembolsado con una sola consulta agrupada.
- Motivo (`ReturnReasonEnum`): `defective` → entrada por devolución **más** salida por merma (`StockMovementReasonEnum::Loss`),
  el stock vendible no cambia; los demás motivos solo hacen la entrada. Un producto por unidad no admite decimales.
- Reembolso: `OrderReturnRefundCalc` — lo que pagó el cliente por las piezas (precio con extras × cantidad, descuento
  de la línea, luego el de la orden; **nunca propina ni domicilio**), proporcional, y al agotar la línea devuelve
  exactamente lo que falta (sin perder centavos). **Espejo en `resources/js/utils/returnRefundCalc.ts`** (estimación en
  pantalla): si cambia una regla, cambia en ambos lados; el backend manda.
- `refund = false` = devolución solo de stock (corrección de inventario): sin dinero, sin caja.
- Venta a crédito: el reembolso baja primero `customers.balance` (hasta lo que deba hoy); el resto sale por método de
  pago. El saldo se descuenta **después** de validar método y caja — un rechazo no debe dejar el adeudo ya reducido.
- Dinero por método: exige caja abierta de la sucursal de la venta (`getActiveSale`) y método (el de la venta por defecto).

### Caja y reportes
- La caja atribuye el reembolso a la **sesión donde se procesa** (como los reembolsos de apartados):
  `MainOrderReportModel::returnsSummary()` resta de `totalSalesByDay()` y de `totalByPaymentMethod()` (lo que bajó el
  saldo resta del grupo sin método, igual que la venta a crédito que revierte); una sesión con solo devoluciones no es
  "vacía" (`isEmptySession`). El resumen sale en `total-current-sales.devoluciones` y como tarjeta en el cierre.
- Estadísticas, ventas por categoría, reporte PDF y crédito de la sesión son **netos de devoluciones atribuidas a la
  venta original** (`OrderModel::scopeWithRefundedAmount()` / `refundedAmountSql()`; subconsultas sobre
  `order_return_items`). Una devolución solo de stock no anula la venta; una venta devuelta por completo deja de contar.
- Historial del cliente: las devoluciones que bajaron su saldo viven en `CustomerModel::balanceReturns()`, **no** en
  `customer_payments` (de ahí sale "último abono" de Estadísticas; un reembolso no es un abono).

### Comprobante impreso
- `ReturnTicketData` + `ReturnFormatter` (extiende `VentaFormatter`, que expone `setUpColumns`/`printFooter`);
  rutas `order/{order}/return/{orderReturn}/print[/bytes]` con `scopeBindings` (la devolución debe ser de esa orden).
  Se ofrece al terminar la devolución (`usePrintReceiptPrompt`, compartido con apartados) y desde el detalle de la orden.

### Frontend
- Todo vive en `components/orders/OrderReturn/` (reutilizable: lo montan Inventario y `OrderReturnModal`), dividido en
  `ReturnLines/`, `ReturnFooter/`, `ReturnOrder/`, `ReturnRefund/` + `useOrderReturnPanel` (compone búsqueda, formulario
  y reembolso). Reglas de validación en `utils/orderReturnSchema.ts` (Yup, errores bajo cada cantidad; el backend las
  repite por concurrencia), cálculos en `utils/returnCalc.ts` y `utils/returnRefundCalc.ts`.
- Tras devolver se invalida con `invalidateOrderReturnQueries` (productos, kardex, órdenes, caja, clientes, estadísticas).

### Tests de referencia
`tests/Orders/OrderReturnTest.php` (stock y motivo), `OrderReturnRefundTest.php` (reembolso, caja, crédito, plazo,
permisos, historial del cliente), `OrderReturnNetSalesTest.php` (reportes netos), `OrderReturnTicketTest.php` (comprobante).
