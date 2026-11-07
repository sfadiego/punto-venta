---
name: optimizacion-peticiones
description: "Revisar si una interaccion necesita optimizar peticiones o estado y con que patron. Usar cuando se pida acelerar una accion de la UI, reducir peticiones HTTP, mejorar el uso con internet lento, UI optimista, debounce, agrupar cambios del carrito o evitar toques descartados (TakeOrder, QuickSale, useCartLineSync)."
---

# Revision de optimizacion de peticiones

Solo analiza y propone; no toques codigo hasta que el usuario autorice las fases (ver memoria `feedback-phased-implementation`). Contexto del feature actual: memoria `project-cart-request-batching`.

## 1. Medir antes de optimizar
- Contar las peticiones de UNA interaccion real (ej. 4 toques al mismo producto): DevTools > Network con "Slow 3G". Incluir los `GET` por `invalidateQueries` y los refetch por el eco del websocket (`orders.updated`).
- Buscar guardas que descartan acciones (`if (isPending(...)) return`): con red lenta pierden toques, es peor que la lentitud.
- Revisar si la UI espera la respuesta para pintar (estado derivado solo de la query).
- Si la interaccion ya hace 1 peticion y no se pierde nada, no hay nada que optimizar: decirlo.

## 2. Elegir el patron (el mas simple que alcance)
| Situacion | Patron |
|---|---|
| Varios cambios sobre la misma linea/campo | UI optimista + debounce (~600 ms) + una peticion con valor absoluto — `hooks/useCartLineSync.ts` |
| Alta de varias lineas de golpe (checkout) | Endpoint batch existente `POST order/{id}/products` (`useCreateOrderProducts`) |
| Varias mutaciones seguidas con refetch cada una | Invalidar una sola vez al quedar todo en reposo |
| Negocio sin cocina (venta por peso) que arma el pedido | Carrito 100 % local y se guarda una vez: `persistCart()` (`useResumeOrder`) crea la orden o llama a `PUT order/{id}/products/sync`, al guardar, imprimir o cobrar; `useWarnBeforeUnload` avisa si hay cambios sin guardar (QuickSale) |
| Borrador local en un negocio con cocina (TakeOrder) | Descartado: cocina debe ver el pedido mientras se arma y salir no siempre se puede interceptar |

Reutilizar lo existente (`useCartLineSync`, `applyCartDraft`, `buildCartLineTemplate`, `findMergeableCartItem`) en vez de crear un segundo motor; revisar duplicacion antes de cerrar (memoria `feedback-avoid-duplicated-code`).

## 3. Reglas de diseno
- Cantidades siempre absolutas, nunca "+1": reintentar es seguro.
- Un envio en vuelo por linea; los toques durante el vuelo solo cambian la cantidad deseada.
- El estado optimista vive en el hook de la pagina (`useTakeOrder`), nunca en modales ni en un componente que se desmonte.
- Lineas nuevas usan id temporal negativo; toda accion con endpoint propio (nota, toppings, descuento) usa `flushLine` para obtener el id real. No usar `-1` ni valores negativos como llave de otros sets.
- Antes de una accion que no se deshace (pagar, cerrar, limpiar carrito, navegar fuera) hacer `await flushAll()` y abortar si devuelve `false`. Hoy: `usePayModal.handleOpen`, `clearCart`, `handleBack` e Imprimir del carrito (`PrintTicketButton` con `onBeforePrint`: el ticket se arma en el servidor desde las líneas guardadas, así que imprimir con toques pendientes saca un ticket desactualizado).
- Peticiones solo por `services/useXxxService.ts`; no axios directo (skill `frontend-react`).
- Sin `localStorage` de pedidos ni `fetch keepalive` con el token salvo decision explicita del usuario.

## 4. Seguridad al optimizar
- El cliente nunca manda precios de catalogo; el servidor los resuelve. El precio del template es solo para pintar.
- No agregar endpoints sin nivel de acceso (skill `seguridad-endpoints`); las validaciones (cantidad 0.001–99, stock, tenant) siguen en el FormRequest.

## 5. Riesgos a comprobar siempre
- ¿Que ve el usuario si el refetch final falla o hay 422 despues de una creacion exitosa?
- ¿Se puede pagar, imprimir ticket o navegar con cambios sin enviar?
- ¿Ids temporales que choquen con llaves de pending-sets, o cambio de `key` de fila al pasar a id real?
- ¿Topes del cliente (stock, 99) para que el error no salte segundos despues?
- Negocio por tipo: restaurante y retail usan `TakeOrder` (motor `useCartLineSync`); venta por peso usa `QuickSale` (carrito local + `persistCart`, cantidades decimales). El backend ignora el `precio` que mande el cliente en líneas de catálogo.
- En QuickSale retomada, dos cajeros editando la misma orden abierta: el último en guardar pisa al otro (el `sync` reemplaza las líneas).
- El motor no tiene pruebas automaticas: verificar a mano con Slow 3G y con la red apagada a medio pedido.

## 6. Entregable
Informar: peticiones actuales vs esperadas, patron elegido y por que, riesgos, lista de fases y archivos a tocar. Esperar autorizacion antes de implementar.
