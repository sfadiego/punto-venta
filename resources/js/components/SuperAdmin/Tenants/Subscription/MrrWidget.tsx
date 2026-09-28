import { DollarSign, Loader } from "lucide-react";
import { formatMoney } from "@/utils/formatCurrency";
import { useMrrWidget } from "./useMrrWidget";

export const MrrWidget = () => {
    const { totalMonthlyRevenue, isLoading } = useMrrWidget();

    return (
        <div className="bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <DollarSign size={16} className="text-indigo-600" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-400 font-medium truncate">Ingreso mensual</p>
                {isLoading ? (
                    <Loader size={14} className="animate-spin text-slate-300 mt-1" />
                ) : (
                    <p className="text-lg font-bold text-slate-900 leading-tight">${formatMoney(totalMonthlyRevenue)}</p>
                )}
            </div>
        </div>
    );
};
