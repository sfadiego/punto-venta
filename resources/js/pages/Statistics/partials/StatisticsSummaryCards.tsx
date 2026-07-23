import { TrendingUp, ShoppingBag, Award, DollarSign } from "lucide-react";
import { IBestSellerItem } from "@/services/useStatisticsService";
import { formatTotal } from "@/utils/formatUnits";

interface StatisticsSummaryCardsProps {
    cajaAbierta: boolean;
    totalVentas: string;
    topProduct?: IBestSellerItem;
    totalLabel: string;
    rankingCount: number;
}

export const StatisticsSummaryCards = ({
    cajaAbierta, totalVentas, topProduct, totalLabel, rankingCount,
}: StatisticsSummaryCardsProps) => (
    <div className={`grid grid-cols-1 gap-4 ${cajaAbierta ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2"}`}>
        {cajaAbierta && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-start gap-4">
                <div className="p-2.5 rounded-xl shrink-0 bg-green-100">
                    <DollarSign size={20} className="text-green-600" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-stone-500 font-medium">Ventas del día</p>
                    <p className="text-base font-bold text-stone-900 mt-0.5 truncate">{totalVentas}</p>
                    <p className="text-xs text-stone-400 mt-0.5">sesión actual</p>
                </div>
            </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-amber-100 shrink-0">
                <Award size={20} className="text-amber-600" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-stone-500 font-medium">Más vendido</p>
                <p className="text-base font-bold text-stone-900 mt-0.5 truncate">
                    {topProduct?.product ?? "—"}
                </p>
                <p className="text-xs text-amber-600 font-semibold mt-0.5">
                    {topProduct ? formatTotal(topProduct.total, topProduct.unidad_medida) : "—"}
                </p>
            </div>
        </div>

        {cajaAbierta && (
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-emerald-100 shrink-0">
                    <ShoppingBag size={20} className="text-emerald-600" />
                </div>
                <div>
                    <p className="text-xs text-stone-500 font-medium">Total vendido</p>
                    <p className="text-2xl font-bold text-stone-900 mt-0.5">{totalLabel}</p>
                </div>
            </div>
        )}

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-blue-100 shrink-0">
                <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div>
                <p className="text-xs text-stone-500 font-medium">Productos en ranking</p>
                <p className="text-2xl font-bold text-stone-900 mt-0.5">{rankingCount}</p>
                <p className="text-xs text-stone-400 mt-0.5">con mayor demanda</p>
            </div>
        </div>
    </div>
);
