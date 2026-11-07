import { useRef, useState } from "react";
import { ICartDraftLine, ICartLineTemplate } from "@/models/ICartDraft";
import { ICartItem } from "@/models/ICartItem";

const DEBOUNCE_MS = 600;

interface IUseCartLineSyncOptions {
    /** Crea la línea en el servidor con la cantidad final y devuelve su order_product.id. */
    onCreate: (template: ICartLineTemplate, quantity: number) => Promise<number>;
    /** Fija la cantidad absoluta (nunca un incremento: reintentar es seguro). */
    onUpdate: (orderProductId: number, quantity: number) => Promise<unknown>;
    onDelete: (orderProductId: number) => Promise<unknown>;
    /** Una línea falló: su cambio local se descartó y vuelve a la última cantidad que confirmó el servidor. */
    onError: (error: unknown) => void;
    /** Ya no queda nada pendiente: refrescar la orden UNA vez. Debe resolver cuando el refetch termine y rechazar si falla. */
    onSettled: () => Promise<unknown>;
}

interface ISyncEntry {
    tempId: number;
    orderProductId: number | null;
    quantity: number;
    // Última cantidad que el servidor confirmó para la línea (0 = no existe o ya se borró).
    confirmed: number;
    template: ICartLineTemplate | null;
    timer: ReturnType<typeof setTimeout> | null;
    running: Promise<void> | null;
    // Sube cada vez que el servidor confirma algo; permite saber si el refetch ya lo incluye.
    revision: number;
}

// Agrupa los toques sobre cada línea del carrito: la pantalla cambia al instante (draftLines) y
// al pasar DEBOUNCE_MS sin toques en esa línea sale UNA sola petición con la cantidad final.
// - Un envío en vuelo por línea; los toques que llegan mientras viaja solo cambian la cantidad
//   deseada y se envían al terminar (ninguno se descarta). Líneas distintas van en paralelo.
// - Una línea nueva se crea con un POST; los toques siguientes esperan a tener su id real.
// - Mientras haya algo pendiente no se refresca la orden: se hace un solo refetch al quedar
//   todo en reposo, y las líneas locales se retiran hasta que ese refetch termina (sin parpadeos).
export const useCartLineSync = (options: IUseCartLineSyncOptions) => {
    const optionsRef = useRef(options);
    optionsRef.current = options;

    const entriesRef = useRef(new Map<number, ISyncEntry>());
    const nextTempIdRef = useRef(-1);
    const settlingRef = useRef<Promise<void> | null>(null);
    const failuresRef = useRef(0);
    const [draftLines, setDraftLines] = useState<ICartDraftLine[]>([]);

    const toDraftLine = (entry: ISyncEntry): ICartDraftLine => ({
        tempId: entry.tempId,
        orderProductId: entry.orderProductId,
        quantity: entry.quantity,
        template: entry.template,
    });

    const publish = () => setDraftLines(Array.from(entriesRef.current.values(), toDraftLine));

    const isBusy = (entry: ISyncEntry) =>
        entry.running !== null || entry.timer !== null || entry.quantity !== entry.confirmed;

    const isIdle = () => Array.from(entriesRef.current.values()).every((entry) => !isBusy(entry));

    const clearTimer = (entry: ISyncEntry) => {
        if (entry.timer !== null) clearTimeout(entry.timer);
        entry.timer = null;
    };

    const settle = (): Promise<void> => {
        if (settlingRef.current) return settlingRef.current;

        const run = async () => {
            try {
                while (isIdle() && entriesRef.current.size > 0) {
                    const revisions = new Map<number, number>();
                    entriesRef.current.forEach((entry, tempId) => revisions.set(tempId, entry.revision));

                    try {
                        await optionsRef.current.onSettled();
                    } catch {
                        // Sin refetch no hay datos nuevos del servidor: se conservan las líneas locales
                        // (ya coinciden con lo confirmado) para no mostrar cantidades viejas.
                        return;
                    }

                    revisions.forEach((revision, tempId) => {
                        const entry = entriesRef.current.get(tempId);
                        if (entry && !isBusy(entry) && entry.revision === revision) {
                            entriesRef.current.delete(tempId);
                        }
                    });
                    publish();
                }
            } finally {
                settlingRef.current = null;
            }
        };

        settlingRef.current = run();
        return settlingRef.current;
    };

    const send = async (entry: ISyncEntry) => {
        const { onCreate, onUpdate, onDelete, onError } = optionsRef.current;

        // Repite mientras lleguen toques durante el vuelo: cada vuelta manda la cantidad deseada actual.
        while (entry.quantity !== entry.confirmed) {
            const sentQuantity = entry.quantity;
            try {
                if (sentQuantity <= 0) {
                    await onDelete(entry.orderProductId!);
                } else if (entry.orderProductId === null) {
                    entry.orderProductId = await onCreate(entry.template!, sentQuantity);
                } else {
                    await onUpdate(entry.orderProductId, sentQuantity);
                }
                entry.confirmed = sentQuantity;
                entry.revision += 1;
            } catch (error) {
                failuresRef.current += 1;
                // Vuelve a lo último que el servidor confirmó; una línea que nunca llegó a crearse desaparece.
                if (entry.confirmed > 0) entry.quantity = entry.confirmed;
                else entriesRef.current.delete(entry.tempId);
                entry.running = null;
                publish();
                onError(error);
                return;
            }
        }
    };

    const flushEntry = (entry: ISyncEntry): Promise<void> => {
        clearTimer(entry);
        if (entry.running) return entry.running;

        // Borrar una línea que nunca llegó al servidor no necesita petición.
        if (entry.quantity <= 0 && entry.orderProductId === null) {
            entriesRef.current.delete(entry.tempId);
            publish();
            if (isIdle()) void settle();
            return Promise.resolve();
        }

        entry.running = send(entry).finally(() => {
            entry.running = null;
            if (isIdle()) void settle();
        });
        return entry.running;
    };

    const scheduleFlush = (entry: ISyncEntry) => {
        clearTimer(entry);
        entry.timer = setTimeout(() => {
            entry.timer = null;
            void flushEntry(entry);
        }, DEBOUNCE_MS);
    };

    const findEntry = (id: number): ISyncEntry | undefined =>
        Array.from(entriesRef.current.values()).find((entry) => entry.tempId === id || entry.orderProductId === id);

    // Agrega una línea nueva (no existe en el servidor); aparece en el carrito con un id temporal.
    const addLine = (template: ICartLineTemplate, quantity: number) => {
        const tempId = nextTempIdRef.current--;
        const entry: ISyncEntry = {
            tempId,
            orderProductId: null,
            quantity,
            confirmed: 0,
            template,
            timer: null,
            running: null,
            revision: 0,
        };
        entriesRef.current.set(tempId, entry);
        scheduleFlush(entry);
        publish();
    };

    // Devuelve el cambio local de una línea ya visible en el carrito (del servidor o local),
    // creándolo si es el primero. Sin cambios previos, lo que se pinta coincide con el servidor.
    const ensureEntry = (item: Pick<ICartItem, "orderProductId" | "quantity">): ISyncEntry => {
        const existing = findEntry(item.orderProductId);
        if (existing) return existing;

        const entry: ISyncEntry = {
            tempId: nextTempIdRef.current--,
            orderProductId: item.orderProductId,
            quantity: item.quantity,
            confirmed: item.quantity,
            template: null,
            timer: null,
            running: null,
            revision: 0,
        };
        entriesRef.current.set(entry.tempId, entry);
        return entry;
    };

    // Suma o resta sobre la cantidad deseada actual de la línea (no sobre la pintada), así dos
    // toques en el mismo render no se pisan. Llegar a 0 borra la línea.
    const adjustQuantity = (item: Pick<ICartItem, "orderProductId" | "quantity">, delta: number) => {
        const entry = ensureEntry(item);
        entry.quantity = Math.max(0, entry.quantity + delta);
        scheduleFlush(entry);
        publish();
    };

    // Envía ya lo pendiente de UNA línea y devuelve su order_product.id real, para acciones que
    // van por su propio endpoint (nota, toppings, descuento) y no pueden usar el id temporal.
    // Null si la línea ya no existe en el servidor (se borró o falló su envío).
    const flushLine = async (id: number): Promise<number | null> => {
        const entry = findEntry(id);
        if (!entry) return id;

        await flushEntry(entry);
        return entry.quantity > 0 && entry.quantity === entry.confirmed ? entry.orderProductId : null;
    };

    // Envía ya todo lo pendiente (sin esperar el debounce) y resuelve cuando el servidor
    // confirmó y la orden se refrescó. Devuelve false si alguna línea falló (ya se avisó con
    // onError y el carrito volvió a lo que tiene el servidor). Para Pagar, navegar fuera, etc.
    const flushAll = async (): Promise<boolean> => {
        const failuresBefore = failuresRef.current;
        const entries = Array.from(entriesRef.current.values());
        await Promise.all(entries.map(flushEntry));
        await settlingRef.current;
        return failuresRef.current === failuresBefore;
    };

    return {
        draftLines,
        addLine,
        adjustQuantity,
        flushLine,
        flushAll,
    };
};
