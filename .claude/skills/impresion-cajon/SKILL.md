---
name: impresion-cajon
description: "Impresion y cajon de dinero del POS. Usar al trabajar con el agente de impresion (printer_enabled, localhost:8765), tickets ESC/POS, PrintController, Bluetooth, VITE_APP_ENV, o el cajon de dinero (open_cash_drawer, useCashDrawer, pulso ESC p)."
---

# Agente de impresion y cajon de dinero

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

### Cajón de dinero (`open_cash_drawer`)
Al cobrar una orden **en efectivo** se manda el pulso ESC/POS para abrir el cajón conectado a la impresora (RJ11).
Solo al cobrar: imprimir o reimprimir un ticket **nunca** abre el cajón (hay un test que lo garantiza).

- **Interruptor por negocio**: `business_config.open_cash_drawer` (boolean, apagado por defecto), Admin → Impresora.
  Es un campo opcional en `PUT /admin/config` (el backend solo lo toca si viene, como `return_days`).
- **Quién lo dispara**: el frontend, tras cerrar la orden y antes de "¿Imprimir ticket?", solo si el método es efectivo
  y no es crédito. Lo llaman los 4 flujos de cobro: `usePayOrder`, `useSaleQuickPay`, `usePayModal` (Orders) y
  `useQuickSalePayment` (QuickSale). Un flujo de cobro nuevo debe llamar `useCashDrawer().openCashDrawer()` también.
- **Cómo sale la señal** (`components/orders/PrintTicket/useCashDrawer.ts`, misma ruta que el ticket vía `resolvePrintRoute`):

| Ruta | Camino |
|---|---|
| Agente local | `agentPrint(CASH_DRAWER_PULSE)` → WebSocket `localhost:8765` → impresora USB. Sin llamar a la API. |
| Bluetooth | `blePrint(CASH_DRAWER_PULSE)`. Sin llamar a la API. |
| Servidor (CUPS/red) | `POST /order/cash-drawer` → `PrintController::openCashDrawer` → `PrinterService::openCashDrawer()`. |

  Sin impresora, cargando o con el interruptor apagado no hace nada ni muestra avisos. Si falla, solo toast
  "No se pudo abrir la caja": el cobro ya quedó registrado.
- **Bytes del pulso**: `utils/cashDrawer.ts` → `CASH_DRAWER_PULSE = [0x1b, 0x70, 0x30, 0x3c, 0x78]` (`ESC p m t1 t2`).
  Deben coincidir con lo que genera `Printer::pulse()` de `mike42/escpos-php` en el backend
  (`PrintTest::test_pulso_del_cajon_son_los_bytes_que_envia_el_frontend` lo verifica).

**Si el cajón no abre (no probado aún con hardware real) — qué cambiar, en este orden:**
1. **Pin del cajón** (la causa más común): cambiar `m` de `0x30` (pin 2) a `0x31` (pin 5) en `utils/cashDrawer.ts`, y el
   mismo byte en `PrintTest::DRAWER_PULSE` (`"\x1bp0\x3c\x78"` → `"\x1bp1\x3c\x78"`). Si el backend (modo servidor) también
   debe usar el pin 5, `AbstractConnector::pulse()` y `NetworkConnector::pulse()` deben llamar `$this->printer->pulse(1)` (hoy usan el default, pin 0).
2. **Tiempos del pulso**: `t1`/`t2` son milisegundos / 2. Si el cajón abre débil o a veces no, subir `0x3c 0x78` a
   `0x64 0xc8` (200 ms / 400 ms) — en el backend `pulse(0, 200, 400)`.
3. **Impresora que ignora ESC p**: probar el comando alterno `DLE DC4` (`0x10 0x14 0x01 0x00 0x01`) en `CASH_DRAWER_PULSE`.
4. **Diagnóstico**: ¿se abre desde el modo servidor pero no desde el agente? Revisar que el agente reenvíe los bytes tal cual
   (no filtre comandos) y que el toast no muestre error. Con la impresora Bluetooth, el pulso va en un solo bloque de 5 bytes
   (`BLE_CHUNK_SIZE` = 20), no debería truncarse.
- Tras cambiar bytes, mantén sincronizados `utils/cashDrawer.ts`, `PrintTest::DRAWER_PULSE` y los `pulse()` de los conectores
  (si se usa el modo servidor), y corre `php artisan test tests/Orders/PrintTest.php`.
