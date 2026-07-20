import { FormikProps } from "formik";
import { Loader } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { PaymentForm } from "../useCustomerDetailPage";

interface CustomerPaymentFormProps {
    balance: number;
    formik: FormikProps<PaymentForm>;
    onLiquidarTodo: () => void;
    isPaying: boolean;
}

export const CustomerPaymentForm = ({ balance, formik, onLiquidarTodo, isPaying }: CustomerPaymentFormProps) => (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-4">
        <h2 className="text-sm font-semibold text-stone-900 mb-4">Registrar pago</h2>
        {balance === 0 ? (
            <p className="text-sm text-stone-400">Este cliente no tiene adeudo pendiente.</p>
        ) : (
            <form onSubmit={formik.handleSubmit} className="space-y-3">
                <div className="flex items-end gap-3 flex-wrap">
                    <div className="flex-1 min-w-[160px]">
                        <Input
                            name="amount"
                            label="Monto a abonar"
                            inputType="text"
                            formik={formik}
                            placeholder="0.00"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={onLiquidarTodo}
                        className="px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors whitespace-nowrap"
                    >
                        Liquidar todo
                    </button>
                </div>
                <Input
                    name="note"
                    label="Nota (opcional)"
                    inputType="text"
                    formik={formik}
                    placeholder="Ej: Pago de la semana"
                />
                <button
                    type="submit"
                    disabled={isPaying}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                    {isPaying && <Loader size={14} className="animate-spin" />}
                    Registrar pago
                </button>
            </form>
        )}
    </div>
);
