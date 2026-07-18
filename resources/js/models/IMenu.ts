export interface IMenuBusiness {
    business_name: string;
    primary_color: string;
    logo: string | null;
    costo_domicilio_default: number;
    has_active_session: boolean;
    menu_enabled: boolean;
    sell_by_weight: boolean;
}

export interface IMenuProduct {
    id: number;
    nombre: string;
    descripcion: string | null;
    precio: number;
    unidad_medida: "unidad" | "kg" | "gr" | null;
    image_url: string | null;
}

export interface IMenuCategory {
    id: number;
    nombre: string;
    icon: string | null;
    products: IMenuProduct[];
}

export interface IMenuProductsPage {
    data: IMenuCategory[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface IPublicOrderItem {
    product_id: number;
    cantidad: number;
    observacion?: string | null;
}

export interface IPublicOrderPayload {
    customer_name: string;
    customer_phone: string;
    is_delivery: boolean;
    delivery_address: string | null;
    delivery_reference: string | null;
    items: IPublicOrderItem[];
}

export interface ICartItem {
    product: IMenuProduct;
    cantidad: number;
    observacion?: string | null;
}
