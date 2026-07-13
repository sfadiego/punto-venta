import { TriangleAlert } from "lucide-react";

interface PayTransferAlertProps {
    isCash: boolean;
}

export const PayTransferAlert = ({ isCash }: PayTransferAlertProps) => (
    <div className={`fade-collapse ${!isCash ? "is-visible" : "is-hidden"}`}>
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <TriangleAlert size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700 leading-relaxed">
                <span className="font-semibold">Solicita el comprobante</span> de transferencia al cliente antes de confirmar el pago.
            </p>
        </div>
    </div>
);
