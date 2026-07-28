import { AlertTriangle } from "lucide-react";

interface CartTotalRowProps {
    totalFinal: number;
    domicilioExcedeTotal: boolean;
}

export const CartTotalRow = ({ totalFinal, domicilioExcedeTotal }: CartTotalRowProps) => (
    <>
        <div className="flex items-center justify-between pt-2 border-t border-stone-200">
            <span className="font-bold text-stone-900">Total</span>
            <span className="font-bold text-stone-900 text-lg tabular-nums">
                ${totalFinal.toFixed(2)}
            </span>
        </div>

        {domicilioExcedeTotal && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200">
                <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">
                    El costo de envío no puede superar el total de la venta cuando lo absorbe el negocio.
                </p>
            </div>
        )}
    </>
);
