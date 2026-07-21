import { BarChart2 } from "lucide-react";

export const StatisticsEmptyState = () => (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center gap-3 py-20">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center">
            <BarChart2 size={26} className="text-stone-300" />
        </div>
        <p className="text-stone-500 font-medium">Sin ventas registradas</p>
        <p className="text-stone-400 text-sm">No hay datos para el período seleccionado.</p>
    </div>
);
