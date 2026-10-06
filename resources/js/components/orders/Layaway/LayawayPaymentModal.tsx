import { Modal } from "@mantine/core";
import { CheckCircle, Gift, Loader } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { PaymentMethodSelector } from "@/components/orders/PayModal/PaymentMethodSelector";
import { IOrder } from "@/models/IOrder";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { formatDateLabel } from "@/utils/dateUtils";
import { LayawayProgress } from "./LayawayProgress";
import { LayawayDueBadge } from "./LayawayDueBadge";
import { LayawayPaymentForm, useLayawayPaymentModal } from "./useLayawayPaymentModal";

interface LayawayPaymentModalProps {
    order: IOrder;
    onClose: () => void;
}

// Se monta solo mientras está abierto (el padre lo renderiza condicionalmente) — así el
// formulario siempre arranca limpio en cada apertura.
export const LayawayPaymentModal = ({ order, onClose }: LayawayPaymentModalProps) => {
    const { formik, paymentMethods, pending, completes, canSubmit, isPending, payAll } = useLayawayPaymentModal(order, onClose);

    return (
        <Modal
            opened
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Gift size={18} className="text-amber-500" />
                    <span className="font-semibold text-stone-800">Abonar a apartado</span>
                </div>
            }
            size="md"
            radius="lg"
            padding="lg"
        >
            <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
                <div>
                    <p className="text-sm font-semibold text-stone-800">{order.customer?.name ?? order.nombre_pedido}</p>
                    <p className="text-xs text-stone-400">Apartado #{order.id}</p>
                </div>

                <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-2">
                    <LayawayProgress total={order.total} paid={order.amount_paid} showAmounts />
                    {order.layaway_due_date && (
                        <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                            <span>Vence el {formatDateLabel(order.layaway_due_date.slice(0, 10))}</span>
                            <LayawayDueBadge dueDate={order.layaway_due_date} />
                        </div>
                    )}
                </div>

                <div>
                    <Input<LayawayPaymentForm>
                        name="amount"
                        label="Monto del abono"
                        inputType="number"
                        inputMode="decimal"
                        placeholder="0.00"
                        min={0}
                        step={0.01}
                        icon="$"
                        formik={formik}
                    />
                    <button
                        type="button"
                        onClick={payAll}
                        className="mt-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                    >
                        Liquidar todo ({formatCurrencyTrimmed(pending)})
                    </button>
                </div>

                <PaymentMethodSelector
                    label="Método de pago"
                    paymentMethods={paymentMethods}
                    paymentMethodId={formik.values.payment_method_id}
                    onSelect={(id) => formik.setFieldValue("payment_method_id", id)}
                />

                {completes && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-700">
                        Con este abono el apartado queda liquidado y la venta se cierra.
                    </div>
                )}

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 w-24 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="flex-1 min-w-0 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader size={14} className="animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={15} />
                                {completes ? "Liquidar y cerrar venta" : "Registrar abono"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
