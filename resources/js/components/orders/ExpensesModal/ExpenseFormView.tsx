import { ReceiptText, Loader } from "lucide-react";
import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";
import { RegisterExpenseForm } from "./useExpensesModal";

interface ExpenseFormViewProps {
    formik: FormikProps<RegisterExpenseForm>;
    onCancel: () => void;
}

export const ExpenseFormView = ({ formik, onCancel }: ExpenseFormViewProps) => (
    <form onSubmit={formik.handleSubmit} className="p-5 space-y-4">
        <Input<RegisterExpenseForm>
            label="Concepto"
            name="concepto"
            placeholder="Ej: Compra de hielo, servilletas..."
            formik={formik}
            maxLength={255}
        />

        <Input<RegisterExpenseForm>
            label="Monto"
            name="monto"
            inputType="number"
            min={0}
            max={999999}
            step={0.5}
            placeholder="$0.00"
            formik={formik}
        />

        <Textarea<RegisterExpenseForm>
            label="Observaciones (opcional)"
            name="observaciones"
            placeholder="Detalles adicionales..."
            formik={formik}
            rows={2}
        />

        <div className="flex gap-2 pt-1">
            <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
            >
                Cancelar
            </button>
            <button
                type="submit"
                disabled={formik.isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
                {formik.isSubmitting ? (
                    <>
                        <Loader size={14} className="animate-spin" />
                        Guardando...
                    </>
                ) : (
                    <>
                        <ReceiptText size={14} />
                        Registrar
                    </>
                )}
            </button>
        </div>
    </form>
);
