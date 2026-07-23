import { IProduct } from "./IProduct";

export interface IModalCartItem {
    orderProductId: number;
    productId: number;
    product: IProduct;
    cantidad: number;
    // precio real guardado en order_product (puede diferir del catálogo en modo precio)
    precioEfectivo: number;
}
