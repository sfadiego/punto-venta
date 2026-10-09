import { PackageX, Wallet, Percent } from "lucide-react";
import { ISlowMovingSummary } from "@/models/ISlowMovingProduct";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";

interface SlowMovingSummaryCardsProps {
    summary?: ISlowMovingSummary;
    days: number;
}

export const SlowMovingSummaryCards = ({ summary, days }: SlowMovingSummaryCardsProps) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-50 rounded-2xl border border-stone-100 p-4 flex items-start gap-3">
            <div className="p-2.5 rounded-xl shrink-0 bg-orange-100">
                <PackageX size={18} className="text-orange-600" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-stone-500 font-medium">Productos estancados</p>
                <p className="text-xl font-bold text-stone-900 mt-0.5">{summary?.stale_count ?? 0}</p>
                <p className="text-xs text-stone-400 mt-0.5">más de {days} días sin moverse</p>
            </div>
        </div>

        <div className="bg-stone-50 rounded-2xl border border-stone-100 p-4 flex items-start gap-3">
            <div className="p-2.5 rounded-xl shrink-0 bg-red-100">
                <Wallet size={18} className="text-red-600" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-stone-500 font-medium">Valor total estancado</p>
                <p className="text-xl font-bold text-stone-900 mt-0.5 tabular-nums">
                    {formatCurrencyTrimmed(summary?.stale_value ?? 0)}
                </p>
                <p className="text-xs text-stone-400 mt-0.5">stock × precio de venta</p>
            </div>
        </div>

        <div className="bg-stone-50 rounded-2xl border border-stone-100 p-4 flex items-start gap-3">
            <div className="p-2.5 rounded-xl shrink-0 bg-amber-100">
                <Percent size={18} className="text-amber-600" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-stone-500 font-medium">Del inventario</p>
                <p className="text-xl font-bold text-stone-900 mt-0.5 tabular-nums">{summary?.stale_value_percent ?? 0}%</p>
                <p className="text-xs text-stone-400 mt-0.5 truncate">
                    de {formatCurrencyTrimmed(summary?.inventory_value ?? 0)} en existencia
                </p>
            </div>
        </div>
    </div>
);
