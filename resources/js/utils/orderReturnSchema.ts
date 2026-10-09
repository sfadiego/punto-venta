import * as Yup from "yup";
import { IOrderProduct } from "@/models/IOrderProduct";
import { IReturnLineValue } from "@/models/IOrderReturnForm";
import { INTEGER_FOR_UNIT_MESSAGE } from "@/utils/stockAdjustmentValidation";
import { calcReturnableQuantity } from "@/utils/returnCalc";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { isWeightUnit } from "@/utils/weightUnits";

// Error de la cantidad de una línea marcada para devolver, o null si es válida: mayor a 0, sin
// exceder lo vendido menos lo ya devuelto, y entera cuando el producto es por unidad. El backend
// repite estas reglas (OrderReturnService / OrderReturnStoreRequest) por si dos personas devuelven
// la misma línea a la vez.
export const validateReturnLine = (value: IReturnLineValue, line: IOrderProduct): string | null => {
    const max = calcReturnableQuantity(line);
    if (max === 0) return "Este producto ya fue devuelto por completo";

    const quantity = Number(value.quantity);
    if (value.quantity.trim() === "" || Number.isNaN(quantity)) return "Ingresa una cantidad válida";
    if (quantity <= 0) return "La cantidad debe ser mayor a 0";

    if (!isWeightUnit(line.product?.unidad_medida) && !Number.isInteger(quantity)) return INTEGER_FOR_UNIT_MESSAGE;

    if (quantity > max) return `Máximo devolvible: ${trimDecimalZeros(max)}`;
    return null;
};

// Validación del formulario de devolución: motivo obligatorio y al menos una línea marcada; cada
// línea marcada se valida contra su propio máximo (los errores cuelgan de `items[i].quantity`). Si el
// reembolso deja dinero por devolver por un método de pago (`methodAmountOf` > 0), el método es obligatorio.
export const buildOrderReturnSchema = (lines: IOrderProduct[], methodAmountOf: (items: IReturnLineValue[]) => number) => {
    const linesById = new Map(lines.map((line) => [line.id, line]));

    return Yup.object({
        reason: Yup.string().required("Selecciona el motivo de la devolución"),
        note: Yup.string().max(255, "Máximo 255 caracteres"),
        refund: Yup.boolean(),
        payment_method_id: Yup.number()
            .nullable()
            .test("method-required", "Selecciona cómo se devuelve el dinero", function (value) {
                const { refund, items } = this.parent as { refund: boolean; items: IReturnLineValue[] };
                return !refund || !!value || methodAmountOf(items) <= 0;
            }),
        items: Yup.array().test("return-lines", "", function (items) {
            const values = (items ?? []) as IReturnLineValue[];
            if (!values.some((item) => item.selected)) {
                return this.createError({ path: "items", message: "Selecciona al menos un producto a devolver" });
            }

            const errors = values.flatMap((item, index) => {
                const line = linesById.get(item.order_product_id);
                const message = item.selected && line ? validateReturnLine(item, line) : null;
                return message ? [new Yup.ValidationError(message, item.quantity, `items[${index}].quantity`)] : [];
            });
            return errors.length > 0 ? new Yup.ValidationError(errors) : true;
        }),
    });
};
