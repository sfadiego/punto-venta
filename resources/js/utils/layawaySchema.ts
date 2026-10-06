import * as Yup from "yup";
import { formatCurrency } from "@/utils/formatCurrency";

// Validación del formulario "Apartar" — el anticipo debe alcanzar el mínimo configurado y ser
// menor al total (cubrirlo completo es una venta normal).
export const buildLayawaySchema = (total: number, minDeposit: number) =>
    Yup.object({
        customer_id: Yup.number().nullable().required("Selecciona un cliente"),
        amount: Yup.number()
            .typeError("Ingresa un monto válido")
            .required("Ingresa el anticipo")
            .min(minDeposit, `El anticipo mínimo es ${formatCurrency(minDeposit)}`)
            .max(total - 0.01, "El anticipo debe ser menor al total de la venta"),
        payment_method_id: Yup.number().nullable().required("Selecciona un método de pago"),
    });
