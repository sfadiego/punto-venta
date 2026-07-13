import { IOrderStatus } from "./IOrderStatus";
import { IOrderProduct } from "./IOrderProduct";
import { IPaymentMethod } from "./IPaymentMethod";

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
    customer_phone: string | null;
    is_delivery: boolean;
    delivery_address: string | null;
    delivery_reference: string | null;
    payment_method_id: number | null;
    payment_method?: Pick<IPaymentMethod, "id" | "name"> | null;
}
