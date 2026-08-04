import { IProduct } from "./IProduct";
import { IProductVariant } from "./IProductVariant";

export interface IOrderProduct {
    id?: number;
    producto_id: number | null;
    variant_id?: number | null;
    pedido_id: number;
    descuento: number;
    cantidad: number;
    precio: number;
    nombre_extra?: string;
    observacion?: string | null;
    is_ready?: boolean;
    created_at: string;
    updated_at: string;
    product: IProduct;
    variant?: IProductVariant | null;
}
