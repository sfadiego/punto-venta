import { X, LayoutGrid, Loader, Bike, FileArchive } from "lucide-react";
import { ISalesByCategory } from "@/models/ISalesByCategory";

interface SalesByCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: ISalesByCategory[];
    isLoading: boolean;
    totalBruto: number;
    totalDomicilios: number;
    totalNeto: number;
    sistemaId: number | null;
}

export const SalesByCategoryModal = ({
    isOpen,
    onClose,
    data,
    isLoading,
    totalBruto,
    totalDomicilios,
    totalNeto,
    sistemaId,
}: SalesByCategoryModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-100">
                            <LayoutGrid size={16} className="text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-stone-900">Ventas por categoría</h2>
                            {sistemaId && (
                                <p className="text-xs text-stone-400">Sesión #{sistemaId}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader size={20} className="animate-spin text-stone-400" />
                        </div>
                    ) : data.length === 0 ? (
                        <p className="text-sm text-stone-400 text-center py-8">
                            Sin ventas en esta sesión
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {data.map((cat) => {
                                const pct = totalBruto > 0 ? (cat.total_revenue / totalBruto) * 100 : 0;
                                return (
                                    <div key={cat.id} className="space-y-1.5">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium text-stone-800">{cat.nombre}</span>
                                            <div className="flex items-center gap-3 text-right">
                                                <span className="text-xs text-stone-400">
                                                    {parseFloat(cat.total_cantidad.toString()).toFixed(2)} kg
                                                </span>
                                                <span className="font-semibold text-stone-900 tabular-nums">
                                                    ${cat.total_revenue.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                                            <div
                                                className="h-full rounded-full bg-amber-400 transition-all"
                                                style={{ width: `${pct.toFixed(1)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-stone-400 text-right">
                                            {pct.toFixed(1)}% del total
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer — desglose */}
                {!isLoading && data.length > 0 && (
                    <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 rounded-b-2xl space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-stone-500">Ventas brutas</span>
                            <span className="font-semibold text-stone-900 tabular-nums">${totalBruto.toFixed(2)}</span>
                        </div>
                        {totalDomicilios > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-1.5 text-stone-500">
                                    <Bike size={13} />
                                    Domicilios
                                </span>
                                <span className="font-semibold text-red-500 tabular-nums">-${totalDomicilios.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                            <span className="text-sm font-semibold text-stone-700">Ingreso neto</span>
                            <span className="text-lg font-bold text-emerald-700 tabular-nums">${totalNeto.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface SalesByCategoryButtonProps {
    onClick: () => void;
}

export const SalesByCategoryButton = ({ onClick }: SalesByCategoryButtonProps) => (
    <button
        onClick={onClick}
        title="Reporte por categoría"
        className="h-9 flex items-center gap-2 px-3 rounded-xl border border-amber-200
            bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100
            hover:border-amber-300 transition-all self-end"
    >
        <FileArchive size={13} />
        Reporte por categoría
    </button>
);

