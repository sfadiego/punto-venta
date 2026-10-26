import { IMainOrderReport } from "@/models/IMainOrderReport";
import { formatSessionDateTime } from "@/utils/dateUtils";

interface CloseSalesReceiptHeaderProps {
    activeSale: IMainOrderReport;
}

export const CloseSalesReceiptHeader = ({ activeSale }: CloseSalesReceiptHeaderProps) => {
    const openedBy = activeSale.user
        ? `${activeSale.user.nombre} ${activeSale.user.apellido_paterno}`
        : `Usuario #${activeSale.user_id}`;
    const notes = activeSale.observaciones?.trim();

    return (
        <header className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b-2 border-[var(--color-primary)]">
            <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-stone-900">Cierre de caja</h1>
                <p className="text-sm text-stone-500 mt-1">
                    Abierta por <span className="font-semibold text-stone-800">{openedBy}</span>
                </p>
                <p className="text-sm text-stone-500 capitalize">{formatSessionDateTime(activeSale.created_at)}</p>
                {notes && <p className="text-sm text-stone-500 mt-1">Observaciones: {notes}</p>}
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Caja abierta
            </span>
        </header>
    );
};
