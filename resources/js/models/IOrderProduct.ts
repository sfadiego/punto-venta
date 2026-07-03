import { IProduct } from "./IProduct";

export interface IOrderProduct {
    id?: number;
    producto_id: number | null;
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
}
