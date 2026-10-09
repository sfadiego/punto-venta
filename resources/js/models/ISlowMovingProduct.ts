// Fila de GET /statistics/slow-moving. Las fechas llegan como texto local "AAAA-MM-DD HH:MM:SS" y
// las cantidades/montos pueden llegar como texto (MySQL devuelve los agregados como string) —
// convertir con Number() al mostrar u ordenar.
export interface ISlowMovingProduct {
    id: number;
    product_code: string | null;
    nombre: string;
    categoria: string | null;
    entry_date: string;
    last_restock_at: string | null;
    last_sale_at: string | null;
    days_idle: number;
    stock: number | string;
    precio: number | string;
    inventory_value: number | string;
    sold_90d: number | string;
}

// Columnas por las que el backend acepta ordenar (SlowMovingProductsReport::SORTABLE).
export type SlowMovingSortColumn = keyof Omit<ISlowMovingProduct, "id">;

export interface ISlowMovingSummary {
    days: number;
    as_of: string;
    stale_count: number;
    stale_value: number;
    inventory_value: number;
    stale_value_percent: number;
}

export interface ISlowMovingFilters {
    days: number;
    search?: string;
    categoria_id?: number | null;
    orderParam?: SlowMovingSortColumn;
    order?: "asc" | "desc";
}
