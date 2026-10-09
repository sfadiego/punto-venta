import { ReturnReasonEnum } from "@/enums/ReturnReasonEnum";

// Una línea de la orden dentro del formulario de devolución: se marca para devolver y lleva
// su cantidad (texto, como cualquier input numérico de Formik).
export interface IReturnLineValue {
    order_product_id: number;
    selected: boolean;
    quantity: string;
}

export interface IOrderReturnForm {
    reason: ReturnReasonEnum | "";
    note: string;
    // Falso = solo regresar al stock, sin devolver dinero (corrección de inventario).
    refund: boolean;
    // Método con el que sale el dinero; solo aplica si hay parte del reembolso que no baja el saldo del cliente.
    payment_method_id: number | null;
    items: IReturnLineValue[];
}
