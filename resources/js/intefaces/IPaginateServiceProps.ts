export interface IFilterProps {
    property: string;
    value: string | number;
    operator?: string;
}

type orderBy = "desc" | "asc";
export interface IPaginateServiceProps {
    filters?: Array<IFilterProps> | null;
    page?: number;
    limit?: number;
    order?: orderBy;
    sistema_id?: number | null;
    estatus_pedido_id?: number | string | null;
    fecha?: string | null;
    semana?: string | null;
    mes?: string | null;
    categoria_id?: number | null;
    search?: string | null;
    branch_id?: number | null;
    // Con `search`, respeta el filtro de estatus en vez de buscar entre activas y cerradas.
    strict_status?: boolean;
    // Solo órdenes que pasaron por un apartado (con lo abonado/reembolsado/retenido de cada una).
    layaways_only?: boolean;
}
