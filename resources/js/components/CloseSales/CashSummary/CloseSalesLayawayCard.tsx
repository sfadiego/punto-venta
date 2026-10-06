import { Gift } from "lucide-react";
import { ILayawaySummary } from "@/services/useOpenSalesService";
import { formatCurrency } from "@/utils/formatCurrency";

interface CloseSalesLayawayCardProps {
    layawaySummary: ILayawaySummary;
}

// Movimiento de apartados de la sesión: lo abonado (anticipos y abonos) menos lo reembolsado por
// cancelaciones. Ese neto ya está incluido en las ventas del día — aquí solo se desglosa.
export const CloseSalesLayawayCard = ({ layawaySummary }: CloseSalesLayawayCardProps) => (
    <div className="sm:col-span-2 bg-white rounded-2xl border border-stone-100 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-start gap-4 sm:flex-1 min-w-0">
                <div className="p-2.5 rounded-xl shrink-0 bg-amber-100">
                    <Gift size={20} className="text-amber-600" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-stone-500 font-medium">Apartados</p>
                    <p className="text-xl font-bold text-stone-900 mt-0.5 tabular-nums">{formatCurrency(layawaySummary.neto)}</p>
                    <p className="text-xs text-stone-400 mt-1">Neto de la sesión · ya incluido en las ventas del día</p>
                </div>
            </div>

            <dl className="sm:w-60 shrink-0 rounded-xl bg-stone-50 border border-stone-100 px-4 py-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                    <dt className="text-stone-500">Abonos recibidos</dt>
                    <dd className="font-semibold text-emerald-600 tabular-nums">+ {formatCurrency(layawaySummary.abonos)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <dt className="text-stone-500">Reembolsos</dt>
                    <dd className="font-semibold text-red-500 tabular-nums">- {formatCurrency(layawaySummary.reembolsos)}</dd>
                </div>
            </dl>
        </div>
    </div>
);
