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
    estatus_pedido_id?: number | null;
    fecha?: string | null;
    categoria_id?: number | null;
}
