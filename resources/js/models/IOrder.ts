import { IOrderStatus } from "./IOrderStatus";
import { IOrderProduct } from "./IOrderProduct";

export interface IOrder {
    id: number;
    total: number;
    subtotal: number;
    descuento: number;
    nombre_pedido: string;
    estatus_pedido_id: number;
    sistema_id: number;
    costo_domicilio: number | string;
    created_at: string;
    updated_at: string;
    status: IOrderStatus;
    order_products?: IOrderProduct[];
}
