import { UnidadMedidaEnum, UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";
import { IOrderProduct } from "@/models/IOrderProduct";

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
