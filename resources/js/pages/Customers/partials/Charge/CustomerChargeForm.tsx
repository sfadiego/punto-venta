import { FormikProps } from "formik";
import { Loader } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { ChargeForm } from "../../useCustomerDetailPage";

interface CustomerChargeFormProps {
    formik: FormikProps<ChargeForm>;
    isCharging: boolean;
}

// Cargo manual — sube el balance del cliente sin una orden real detrás, para dar de alta el
// adeudo que ya traía antes de empezar a usar el sistema. A diferencia de CustomerPaymentForm
// no tiene botón "Liquidar todo" ni se oculta con balance en 0 (siempre se puede agregar). Sin
// tarjeta/título propios — vive dentro de CustomerChargeModal, que ya trae ambos.
export const CustomerChargeForm = ({ formik, isCharging }: CustomerChargeFormProps) => (
    <form onSubmit={formik.handleSubmit} className="space-y-3">
        <Input
            name="amount"
            label="Monto del cargo"
            inputType="text"
            formik={formik}
            placeholder="0.00"
        />
        <Input
            name="note"
            label="Nota (opcional)"
            inputType="text"
            formik={formik}
            placeholder="Ej: Adeudo previo al sistema"
        />
        <button
            type="submit"
            disabled={isCharging}
            className="w-full py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
            {isCharging && <Loader size={14} className="animate-spin" />}
            Agregar Adeudo
        </button>
    </form>
);
