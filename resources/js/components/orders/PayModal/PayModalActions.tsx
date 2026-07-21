import { CheckCircle, Loader } from "lucide-react";

interface PayModalActionsProps {
    canPay: boolean;
    isPending: boolean;
    onPay: () => void;
    onClose: () => void;
    confirmLabel?: string;
}

export const PayModalActions = ({ canPay, isPending, onPay, onClose, confirmLabel = "Pagar y cerrar" }: PayModalActionsProps) => (
    <div className="flex gap-2 pt-1">
        <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
        >
            Cancelar
        </button>
        <button
            type="button"
            onClick={onPay}
            disabled={!canPay || isPending}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
        >
            {isPending ? (
                <>
                    <Loader size={14} className="animate-spin" />
                    Procesando...
                </>
            ) : (
                <>
                    <CheckCircle size={15} />
                    {confirmLabel}
                </>
            )}
        </button>
    </div>
);
