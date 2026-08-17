import { X, LayoutGrid } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";
import { resolveReportPeriodLabel } from "@/utils/dateUtils";
import { DownloadReportButton } from "./DownloadReportButton";

interface RestaurantSalesModalProps {
    isOpen: boolean;
    onClose: () => void;
    isLoading: boolean;
    isError?: boolean;
    totalBruto: number;
    totalDomicilios: number;
    totalNeto: number;
    fecha?: string | null;
    semana?: string | null;
    mes?: string | null;
    canDownload?: boolean;
    isDownloading?: boolean;
    onDownload?: () => void;
}

export const RestaurantSalesModal = ({
    isOpen,
    onClose,
    isLoading,
    isError = false,
    totalBruto,
    totalDomicilios,
    totalNeto,
    fecha,
    semana,
    mes,
    canDownload = false,
    isDownloading = false,
    onDownload,
}: RestaurantSalesModalProps) => {
    if (!isOpen) return null;

    const fechaLabel = resolveReportPeriodLabel(fecha, semana, mes);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-amber-100">
                            <LayoutGrid size={16} className="text-amber-600" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-stone-900">
                                Resumen de ventas
                            </h2>
                            {fechaLabel && (
                                <p className="text-xs text-stone-400">{fechaLabel}</p>
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

                <div className="p-6">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-5 h-5 border-2 border-stone-200 border-t-amber-500 rounded-full animate-spin" />
                        </div>
                    ) : isError ? (
                        <p className="text-sm text-red-400 text-center py-6">
                            Error al cargar el reporte. Intenta de nuevo.
                        </p>
                    ) : totalBruto === 0 ? (
                        <p className="text-sm text-stone-400 text-center py-6">
                            Sin ventas cerradas registradas
                        </p>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-3 border-b border-stone-100">
                                <span className="text-sm text-stone-500">Ventas brutas</span>
                                <span className="text-lg font-bold text-stone-900 tabular-nums">
                                    {formatCurrency(totalBruto)}
                                </span>
                            </div>

                            {totalDomicilios > 0 && (
                                <div className="flex items-center justify-between py-3 border-b border-stone-100">
                                    <span className="text-sm text-stone-500">Domicilios</span>
                                    <span className="text-base font-semibold text-red-500 tabular-nums">
                                        -{formatCurrency(totalDomicilios)}
                                    </span>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-3">
                                <span className="text-base font-semibold text-stone-700">
                                    Ingreso neto
                                </span>
                                <span className="text-2xl font-bold text-emerald-700 tabular-nums">
                                    {formatCurrency(totalNeto)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {!isLoading && onDownload && (
                    <div className="px-6 py-4 border-t border-stone-100">
                        <DownloadReportButton
                            onClick={onDownload}
                            disabled={!canDownload}
                            isDownloading={isDownloading}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};
