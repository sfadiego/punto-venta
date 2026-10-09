import { FormikProps } from "formik";
import { RETURN_REASON_LABELS, ReturnReasonEnum } from "@/enums/ReturnReasonEnum";
import { IOrderReturnForm } from "@/models/IOrderReturnForm";
import { ReturnRefundSection } from "../ReturnRefund/ReturnRefundSection";
import { ReturnRefundState } from "../ReturnRefund/useReturnRefund";
import { formatReturnSummary } from "@/utils/returnCalc";
import { ReturnNoteField } from "./ReturnNoteField";
import { ReturnReasonChips } from "./ReturnReasonChips";

interface ReturnFooterProps {
    formik: FormikProps<IOrderReturnForm>;
    selectedCount: number;
    piecesCount: number;
    refund: ReturnRefundState;
    onToggleRefund: (refund: boolean) => void;
    onSelectMethod: (paymentMethodId: number) => void;
    customerName?: string;
}

// Pie fijo de la devolución: motivo, reembolso, nota, resumen y botón. Va fuera de la lista desplazable, así
// que no se pierde de vista aunque la venta tenga muchos productos.
export const ReturnFooter = ({ formik, selectedCount, piecesCount, refund, onToggleRefund, onSelectMethod, customerName }: ReturnFooterProps) => {
    const { reason } = formik.values;
    const reasonError = formik.submitCount > 0 && typeof formik.errors.reason === "string" ? formik.errors.reason : undefined;
    // Devolver dinero por un método exige una caja abierta de donde salga.
    const isReady = selectedCount > 0 && reason !== "" && !refund.hasNoOpenCash;

    return (
        <div className="flex flex-col gap-3 border-t border-stone-200 pt-4">
            <ReturnReasonChips
                value={reason}
                onChange={(selected) => formik.setFieldValue("reason", selected)}
                error={reasonError}
            />
            {selectedCount > 0 && (
                <ReturnRefundSection
                    refund={refund}
                    formik={formik}
                    onToggleRefund={onToggleRefund}
                    onSelectMethod={onSelectMethod}
                    customerName={customerName}
                />
            )}

            {reason === ReturnReasonEnum.Defective && (
                <p className="text-xs text-amber-700">Las piezas defectuosas no vuelven al stock vendible: se registran como merma.</p>
            )}

            <ReturnNoteField formik={formik} />

            <div>
                <p className="mb-2 min-h-4 text-xs text-stone-500">
                    {formatReturnSummary(selectedCount, piecesCount, reason ? RETURN_REASON_LABELS[reason] : undefined)}
                </p>
                <button
                    type="submit"
                    disabled={formik.isSubmitting || !isReady}
                    className="h-11 w-full rounded-xl bg-emerald-500 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-stone-300"
                >
                    {formik.isSubmitting
                        ? "Guardando..."
                        : selectedCount > 0
                          ? `Devolver ${selectedCount} ${selectedCount === 1 ? "producto" : "productos"}`
                          : "Devolver"}
                </button>
            </div>
        </div>
    );
};
