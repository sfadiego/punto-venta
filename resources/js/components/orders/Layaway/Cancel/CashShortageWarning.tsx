import { TriangleAlert } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface CashShortageWarningProps {
    cashOnHand: number;
    refund: number;
}

// Aviso (no bloquea): el reembolso en efectivo es mayor al efectivo que hay en la caja, que quedaría
// en negativo — el dinero tendría que salir de otro lado (ej. del dueño o de la caja anterior).
export const CashShortageWarning = ({ cashOnHand, refund }: CashShortageWarningProps) => (
    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
        <TriangleAlert size={15} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-semibold">El efectivo en caja quedará en negativo.</span> Hay {formatCurrency(cashOnHand)} en
            efectivo y el reembolso es de {formatCurrency(refund)} (faltarían {formatCurrency(refund - cashOnHand)}). Puedes
            continuar, pero ese dinero tendría que salir de otro lado.
        </p>
    </div>
);
