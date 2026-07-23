import { CreditCard, Loader } from "lucide-react";
import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { PaymentForm } from "../useSettingsPage";

interface PaymentInfoFormProps {
    formik: FormikProps<PaymentForm>;
}

export const PaymentInfoForm = ({ formik }: PaymentInfoFormProps) => (
    <form onSubmit={formik.handleSubmit}>
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center gap-2.5">
                <CreditCard size={16} className="text-indigo-500" />
                <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Datos de pago</h2>
            </div>
            <p className="text-xs text-slate-400 -mt-3">
                Esta información se mostrará a los clientes en su página de suscripción.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="bank" label="Banco" placeholder="Ej. Mercado Pago" formik={formik} />
                <Input name="account" label="Número de cuenta" placeholder="Ej. 1234567890" formik={formik} />
                <div className="sm:col-span-2">
                    <Input name="holder" label="Titular" placeholder="Nombre completo" formik={formik} />
                </div>
                <div className="sm:col-span-2">
                    <Input
                        name="concept"
                        label="Concepto"
                        placeholder="Ej. Mensualidad Sistema POS"
                        formik={formik}
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={formik.isSubmitting || !formik.dirty}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                    {formik.isSubmitting && <Loader size={14} className="animate-spin" />}
                    Guardar datos de pago
                </button>
            </div>
        </section>
    </form>
);
