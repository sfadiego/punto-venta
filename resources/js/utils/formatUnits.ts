import { UnidadMedidaEnum, UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";
import { IOrderProduct } from "@/models/IOrderProduct";
import { IProductGroup } from "@/models/IProductGroup";

export const formatTotal = (total: number, unidad: UnidadMedidaEnum): string => {
    if (unidad === UnidadMedidaEnum.Kg || unidad === UnidadMedidaEnum.Gr || unidad === UnidadMedidaEnum.Litro)
        return `${total.toFixed(3).replace(/\.?0+$/, "")} ${unidad}`;
    return `${total} und`;
};

export const formatCantidad = (item: IOrderProduct): string => {
    const unidad = item.product?.unidad_medida;
    const esPeso = unidad === UnidadMedidaEnum.Kg || unidad === UnidadMedidaEnum.Gr || unidad === UnidadMedidaEnum.Litro;
    if (!esPeso) return String(parseFloat(item.cantidad.toString()));
    const n = parseFloat(item.cantidad.toString());
    const formatted = n % 1 === 0 ? String(n) : String(parseFloat(n.toFixed(3)));
    return `${formatted} ${UNIDAD_LABELS[unidad]}`;
};

const esPesoUnidad = (unidad?: UnidadMedidaEnum): boolean =>
    unidad === UnidadMedidaEnum.Kg || unidad === UnidadMedidaEnum.Gr || unidad === UnidadMedidaEnum.Litro;

// Etiqueta "N unidades" para una fila de la orden. Para productos por peso retorna null porque
// el badge ya muestra la unidad de medida (ej. "0.5 kg") y agregar "unidades" sería incorrecto.
export const formatUnitsLabel = (item: IOrderProduct): string | null => {
    if (esPesoUnidad(item.product?.unidad_medida)) return null;
    return `${formatCantidad(item)} unidades`;
};

// Valor del badge grande del grupo: suma real de unidades (no cantidad de filas/entregas).
export const formatGroupTotal = (group: IProductGroup): string => {
    const unidad = group.items[0]?.product?.unidad_medida;
    return esPesoUnidad(unidad) ? formatTotal(group.totalUnits, unidad as UnidadMedidaEnum) : String(group.totalUnits);
};

// Texto de resumen del grupo: total de unidades, cuántas entregas (filas) lo componen y cuántas están listas.
export const formatGroupSummary = (group: IProductGroup): string => {
    const unidad = group.items[0]?.product?.unidad_medida;
    const totalLabel = esPesoUnidad(unidad)
        ? formatTotal(group.totalUnits, unidad as UnidadMedidaEnum)
        : `${group.totalUnits} unidades`;
    return `${totalLabel} · ${group.totalCount} entregas · ${group.readyCount}/${group.totalCount} listas`;
};
