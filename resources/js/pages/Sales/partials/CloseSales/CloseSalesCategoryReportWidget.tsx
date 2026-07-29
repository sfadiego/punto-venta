import { LayoutGrid, ChevronRight } from "lucide-react";

interface Props {
    onOpen: () => void;
}

export default function CloseSalesCategoryReportWidget({ onOpen }: Props) {
    return (
        <button
            onClick={onOpen}
            className="group w-full bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6 text-left
                cursor-pointer hover:border-amber-200 hover:shadow-md hover:bg-amber-50/40 transition-all"
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-100">
                        <LayoutGrid size={16} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-stone-700">Reporte por categoría</p>
                        <p className="text-xs text-stone-400">Desglose de ventas de la sesión</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 shrink-0">
                    <span>Ver reporte</span>
                    <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </div>
            </div>
        </button>
    );
}
