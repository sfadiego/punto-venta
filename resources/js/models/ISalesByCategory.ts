export interface ISalesByCategory {
    id: number;
    nombre: string;
    total_cantidad: number;
    total_revenue: number;
}

export interface ISalesByCategoryResponse {
    categories: ISalesByCategory[];
    domicilios: number;
}
