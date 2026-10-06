export interface IAddon {
    id: number;
    name: string;
    price: number;
    is_active: boolean;
    /** Solo en el listado paginado: cuántos productos tienen asignado el topping. */
    products_count?: number;
    /** Solo en el detalle (GET /addon/{id}): ids de los productos donde se ofrece. */
    product_ids?: number[];
    created_at?: string;
    updated_at?: string;
}

/** Topping elegido al agregar un producto a la orden (lo que se envía al backend). */
export interface IAddonSelection {
    addon_id: number;
    quantity: number;
}

export interface IAddonFormPayload {
    name: string;
    price?: number;
    is_active?: boolean;
}
