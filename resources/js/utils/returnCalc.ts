import { IOrderProduct } from "@/models/IOrderProduct";
import { IReturnLineValue } from "@/models/IOrderReturnForm";
import { trimDecimalZeros } from "@/utils/formatDecimal";

// Redondeo a 3 decimales: las cantidades de peso/volumen son decimales y restar flotantes
// (ej. 1.1 - 0.7) deja ruido que haría fallar la comparación contra el máximo.
const roundQuantity = (value: number): number => Math.round(value * 1000) / 1000;

// Unidades ya devueltas de una línea — suma de sus movimientos de devolución (OrderController::show
// solo trae los de reason=Return). Las cantidades de stock_movements llegan como string.
export const calcReturnedQuantity = (line: IOrderProduct): number =>
    roundQuantity((line.stock_movements ?? []).reduce((sum, movement) => sum + Number(movement.quantity), 0));

// Máximo devolvible de una línea: lo vendido menos lo ya devuelto. Mismo cálculo que
// OrderReturnService::create() en el backend, que lo vuelve a validar al enviar.
export const calcReturnableQuantity = (line: IOrderProduct): number =>
    Math.max(0, roundQuantity(Number(line.cantidad) - calcReturnedQuantity(line)));

// Valores iniciales del formulario de devolución: ninguna línea marcada. Una línea sin id no
// existe en BD todavía, así que nunca llega aquí (el hook solo pasa líneas con producto).
export const buildReturnLineValues = (lines: IOrderProduct[]): IReturnLineValue[] =>
    lines.map((line) => ({ order_product_id: line.id as number, selected: false, quantity: "" }));

// Marca o desmarca una línea. Al marcarla sin cantidad, propone todo lo devolvible — lo habitual
// es devolver la línea completa y basta con bajar la cantidad si es parcial.
export const toggleReturnLine = (line: IOrderProduct, item: IReturnLineValue, selected: boolean): IReturnLineValue => ({
    ...item,
    selected,
    quantity: selected && item.quantity === "" ? trimDecimalZeros(calcReturnableQuantity(line)) : item.quantity,
});

// "Devolver todo": marca todas las líneas con algo devolvible, con su máximo. Las ya devueltas por
// completo se dejan como están. `items` está alineado por índice con `lines`.
export const selectAllReturnLines = (lines: IOrderProduct[], items: IReturnLineValue[]): IReturnLineValue[] =>
    items.map((item, index) =>
        calcReturnableQuantity(lines[index]) > 0
            ? { ...item, selected: true, quantity: trimDecimalZeros(calcReturnableQuantity(lines[index])) }
            : item,
    );

export interface IReturnLineEntry {
    line: IOrderProduct;
    /** Posición de la línea en `lines` — es la de su valor en el formulario (`items[index]`). */
    index: number;
}

// Líneas con su índice original. Las ya devueltas por completo van al final: lo que se puede
// devolver queda arriba.
export const sortReturnLines = (lines: IOrderProduct[]): IReturnLineEntry[] =>
    lines
        .map((line, index) => ({ line, index }))
        .sort((a, b) => Number(calcReturnableQuantity(a.line) === 0) - Number(calcReturnableQuantity(b.line) === 0));

// Piezas que suma la devolución: las cantidades de las líneas marcadas.
export const sumReturnPieces = (items: IReturnLineValue[]): number =>
    roundQuantity(items.filter((item) => item.selected).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0));

const pluralize = (count: number, one: string, many: string): string => `${trimDecimalZeros(count)} ${count === 1 ? one : many}`;

// Resumen de lo que se va a devolver, ej. "3 productos · 4 piezas · Producto defectuoso".
export const formatReturnSummary = (selectedCount: number, pieces: number, reasonLabel?: string): string => {
    if (selectedCount === 0) return "Marca los productos que se devuelven";

    return [pluralize(selectedCount, "producto", "productos"), pluralize(pieces, "pieza", "piezas"), reasonLabel]
        .filter(Boolean)
        .join(" · ");
};

// ¿Queda algo por devolver en la orden? Falso cuando todas las líneas con producto ya se devolvieron
// por completo.
export const hasReturnableLines = (lines: IOrderProduct[]): boolean =>
    lines.some((line) => !!line.producto_id && calcReturnableQuantity(line) > 0);
