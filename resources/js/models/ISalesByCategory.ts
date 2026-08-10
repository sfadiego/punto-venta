import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";

export interface ISalesByCategoryUnit {
    unidad_medida: UnidadMedidaEnum;
    total_cantidad: number;
}

export interface ISalesByCategory {
    id: number;
    nombre: string;
    total_revenue: number;
    units: ISalesByCategoryUnit[];
}

export interface ISalesByCategoryResponse {
    categories: ISalesByCategory[];
    domicilios: number;
}
