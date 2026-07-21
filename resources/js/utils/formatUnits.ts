import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";

export const formatTotal = (total: number, unidad: UnidadMedidaEnum): string => {
    if (unidad === UnidadMedidaEnum.Kg || unidad === UnidadMedidaEnum.Gr)
        return `${total.toFixed(3).replace(/\.?0+$/, "")} ${unidad}`;
    return `${total} und`;
};
