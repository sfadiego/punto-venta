import { IOrder } from "@/models/IOrder";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// ¿Sigue abierto el plazo de devolución? Cuenta desde que se concretó la venta; 0 días = sin límite. Misma
// regla que OrderReturnStoreRequest::returnWindowError() (el backend manda). Sin fecha de cierre no se
// puede saber, así que no se bloquea en pantalla y decide el servidor.
export const isReturnWindowOpen = (order: Pick<IOrder, "closed_at">, returnDays: number, now: Date = new Date()): boolean => {
    if (returnDays <= 0 || !order.closed_at) return true;

    return now.getTime() - new Date(order.closed_at).getTime() <= returnDays * MS_PER_DAY;
};

export const returnWindowMessage = (returnDays: number): string =>
    `Pasó el plazo de devolución (${returnDays} ${returnDays === 1 ? "día" : "días"} desde la venta).`;
