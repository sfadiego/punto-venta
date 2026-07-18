import { AlertCircle } from "lucide-react";

interface CloseSalesActiveOrdersAlertProps {
    count: number;
}

export const CloseSalesActiveOrdersAlert = ({ count }: CloseSalesActiveOrdersAlertProps) => (
    <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-4">
        <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
        <div>
            <p className="text-sm font-semibold text-amber-800">No puedes cerrar la caja</p>
            <p className="text-sm text-amber-700 mt-0.5">
                Tienes {count} {count === 1 ? "orden pendiente" : "órdenes pendientes"} (en proceso, servidas o pendientes de confirmar). Finaliza todas antes de cerrar.
            </p>
        </div>
    </div>
);
