import { DollarSign, Loader } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { useMrrWidget } from "./useMrrWidget";

export const MrrWidget = () => {
    const { totalMonthlyRevenue, isLoading } = useMrrWidget();

    return (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <DollarSign size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Ingreso mensual</p>
                    {isLoading ? (
                        <Loader size={18} className="animate-spin text-slate-300 mt-1" />
                    ) : (
                        <p className="text-2xl font-bold text-slate-900 leading-tight">{formatCurrency(totalMonthlyRevenue)}</p>
                    )}
                </div>
            </div>
        </div>
    );
};
