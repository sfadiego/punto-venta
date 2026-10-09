import { FormikProps } from "formik";
import { CashShortageWarning } from "@/components/orders/Layaway/Cancel/CashShortageWarning";
import { PaymentMethodSelector } from "@/components/orders/PayModal/PaymentMethodSelector";
import { IOrderReturnForm } from "@/models/IOrderReturnForm";
import { formatCurrency } from "@/utils/formatCurrency";
import { ReturnRefundState } from "./useReturnRefund";

interface ReturnRefundSectionProps {
    refund: ReturnRefundState;
    formik: FormikProps<IOrderReturnForm>;
    onToggleRefund: (refund: boolean) => void;
    onSelectMethod: (paymentMethodId: number) => void;
    /** Cliente de una venta a crédito — nombra de quién se descuenta el saldo. */
    customerName?: string;
}

// Dinero que se devuelve con las líneas marcadas: el total, cuánto baja el saldo del cliente (venta
// a crédito) y por qué método sale el resto. La casilla "No devolver dinero" la deja como corrección de
// inventario, sin mover dinero.
export const ReturnRefundSection = ({ refund, formik, onToggleRefund, onSelectMethod, customerName }: ReturnRefundSectionProps) => {
    const { estimate, paymentMethods, needsMethod, hasNoOpenCash, hasCashShortage, cashOnHand } = refund;
    const refunds = formik.values.refund;
    const methodError = formik.submitCount > 0 && typeof formik.errors.payment_method_id === "string" ? formik.errors.payment_method_id : null;

    return (
        <div className="space-y-3 rounded-xl bg-stone-50 px-3.5 py-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-600">Reembolso</p>
                    {refunds && estimate.balanceApplied > 0 && (
                        <p className="text-xs text-stone-500">
                            {formatCurrency(estimate.balanceApplied)} se descuentan del saldo{customerName ? ` de ${customerName}` : " del cliente"}
                        </p>
                    )}
                </div>
                <p className="shrink-0 text-lg font-bold tabular-nums text-stone-900">
                    {refunds ? formatCurrency(estimate.total) : "Sin reembolso"}
                </p>
            </div>

            {needsMethod && (
                <div>
                    <PaymentMethodSelector
                        label={`Se devuelven ${formatCurrency(estimate.methodAmount)} por`}
                        paymentMethods={paymentMethods}
                        paymentMethodId={formik.values.payment_method_id}
                        onSelect={onSelectMethod}
                    />
                    {methodError && <p className="mt-1 text-xs text-red-500">{methodError}</p>}
                </div>
            )}

            {hasNoOpenCash && (
                <p className="text-xs text-red-500">
                    No hay una caja abierta. Ábrela para devolver dinero, o marca «No devolver dinero».
                </p>
            )}
            {hasCashShortage && cashOnHand !== null && <CashShortageWarning cashOnHand={cashOnHand} refund={estimate.methodAmount} />}

            <label className="flex cursor-pointer items-center gap-2.5 border-t border-stone-200 pt-3">
                <input
                    type="checkbox"
                    checked={!refunds}
                    onChange={(e) => onToggleRefund(!e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border-stone-300 accent-amber-500"
                />
                <span className="text-sm text-stone-600">No devolver dinero, solo regresar al stock</span>
            </label>
        </div>
    );
};
