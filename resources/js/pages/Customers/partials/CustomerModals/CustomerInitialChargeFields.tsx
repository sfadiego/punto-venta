import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { CustomerForm } from "./useAddCustomerModal";

interface CustomerInitialChargeFieldsProps {
    formik: FormikProps<CustomerForm>;
}

// Adeudo inicial opcional al dar de alta un cliente — mismo caso de uso que CustomerChargeForm
// (dentro del detalle del cliente), pero aquí en la misma petición de creación, para poder dar
// de alta una lista de clientes que ya traían deuda antes de integrar el sistema.
export const CustomerInitialChargeFields = ({ formik }: CustomerInitialChargeFieldsProps) => {
    const isExpanded = formik.values.has_initial_charge ?? false;

    return (
        // Ocupa las dos columnas del grid (junto a "Permite crédito") al expandirse, para que
        // Monto/Nota tengan ancho suficiente en vez de quedar apretados en media columna.
        <div className={`rounded-xl bg-stone-50 border border-stone-100 p-3.5 h-fit ${isExpanded ? "sm:col-span-2" : ""}`}>
            <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                    type="checkbox"
                    checked={isExpanded}
                    onChange={(e) => formik.setFieldValue("has_initial_charge", e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm text-stone-700">Agregar adeudo inicial</span>
            </label>

            {isExpanded && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <Input
                        name="initial_charge_amount"
                        label="Monto del adeudo"
                        inputType="text"
                        formik={formik}
                        placeholder="0.00"
                    />
                    <Input
                        name="initial_charge_note"
                        label="Nota (opcional)"
                        inputType="text"
                        formik={formik}
                        placeholder="Ej: Adeudo previo al sistema"
                    />
                </div>
            )}
        </div>
    );
};
