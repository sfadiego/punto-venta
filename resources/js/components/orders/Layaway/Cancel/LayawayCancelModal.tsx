import { Modal } from "@mantine/core";
import { Ban, Loader } from "lucide-react";
import { Textarea } from "@/components/ui/form/textarea";
import { PaymentMethodSelector } from "@/components/orders/PayModal/PaymentMethodSelector";
import { IOrder } from "@/models/IOrder";
import { CashShortageWarning } from "./CashShortageWarning";
import { LayawayCancelSummary } from "./LayawayCancelSummary";
import { LayawayRetentionSelector } from "./LayawayRetentionSelector";
import { LayawayCancelForm, useLayawayCancelModal } from "./useLayawayCancelModal";

interface LayawayCancelModalProps {
    order: IOrder;
    onClose: () => void;
}

// Se monta solo mientras está abierto (el padre lo renderiza condicionalmente) — así el formulario
// siempre arranca limpio, con la retención sugerida por el negocio.
export const LayawayCancelModal = ({ order, onClose }: LayawayCancelModalProps) => {
    const cancel = useLayawayCancelModal(order, onClose);
    const { formik, paid, refund, retained, paymentMethods, cashOnHand, hasCashShortage, canSubmit, isPending } = cancel;

    return (
        <Modal
            opened
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Ban size={18} className="text-red-500" />
                    <span className="font-semibold text-stone-800">Cancelar apartado #{order.id}</span>
                </div>
            }
            size="lg"
            radius="lg"
            padding="lg"
        >
            <form onSubmit={formik.handleSubmit} noValidate className="space-y-4">
                <p className="text-sm text-stone-500">
                    <b className="font-semibold">{order.customer?.name ?? order.nombre_pedido}</b>. Se devolverá el stock y se reembolsará lo abonado, salvo la parte que el
                    negocio retenga.
                </p>

                <LayawayRetentionSelector cancel={cancel} />

                <LayawayCancelSummary paid={paid} refund={refund} retained={retained} />

                {refund > 0 && (
                    <PaymentMethodSelector
                        label="Método del reembolso"
                        paymentMethods={paymentMethods}
                        paymentMethodId={formik.values.payment_method_id}
                        onSelect={(id) => formik.setFieldValue("payment_method_id", id)}
                    />
                )}

                {hasCashShortage && cashOnHand !== null && <CashShortageWarning cashOnHand={cashOnHand} refund={refund} />}

                <Textarea<LayawayCancelForm>
                    name="note"
                    label="Nota (opcional)"
                    placeholder="Ej. El cliente desistió de la compra"
                    rows={2}
                    maxLength={500}
                    formik={formik}
                />

                <div className="flex gap-2 pt-1">
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 w-24 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
                    >
                        Volver
                    </button>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="flex-1 min-w-0 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                        {isPending ? (
                            <>
                                <Loader size={14} className="animate-spin" />
                                Procesando...
                            </>
                        ) : (
                            "Cancelar apartado"
                        )}
                    </button>
                </div>
            </form>
        </Modal>
    );
};
