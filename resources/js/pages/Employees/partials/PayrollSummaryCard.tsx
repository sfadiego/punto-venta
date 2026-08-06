import { Wallet, Loader } from "lucide-react";
import { formatCurrencyTrimmed as formatCurrency } from "@/utils/formatCurrency";
import { PayrollFilterPeriod } from "@/models/IEmployee";
import { usePayrollSummaryCard } from "./usePayrollSummaryCard";

const PERIOD_LABELS: Record<PayrollFilterPeriod, string> = {
    week: "Semana",
    month: "Mes",
};

export const PayrollSummaryCard = () => {
    const { period, setPeriod, total, employeesCount, isLoading } = usePayrollSummaryCard();

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Wallet size={18} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="text-xs text-stone-400">Nómina estimada</p>
                        {isLoading ? (
                            <Loader size={18} className="animate-spin text-stone-300 mt-1" />
                        ) : (
                            <p className="text-2xl font-bold text-stone-900 leading-tight">{formatCurrency(total)}</p>
                        )}
                        <p className="text-xs text-stone-400 mt-0.5">
                            {employeesCount} {employeesCount === 1 ? "empleado activo" : "empleados activos"}
                        </p>
                    </div>
                </div>

                <div className="flex rounded-lg border border-stone-200 overflow-hidden shrink-0">
                    {(Object.keys(PERIOD_LABELS) as PayrollFilterPeriod[]).map((key) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setPeriod(key)}
                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                                period === key ? "bg-amber-500 text-white" : "bg-white text-stone-500 hover:bg-stone-50"
                            }`}
                        >
                            {PERIOD_LABELS[key]}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
