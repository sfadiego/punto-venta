import { DollarSign, TrendingUp, Wallet, CalendarClock, User, MessageSquare, AlertCircle, Lock, Bike } from "lucide-react";
import { useCloseSalesPage } from "./useCloseSalesPage";
import BestSellerWidget from "./BestSellerWidget";
import { SalesByCategoryButton, SalesByCategoryModal } from "@/pages/Sales/partials/SalesByCategoryModal";
import { useSalesByCategoryModal } from "@/pages/Sales/partials/useSalesByCategoryModal";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export default function CloseSalesPage() {
    const {
        activeSale,
        sistemaId,
        efectivoInicio,
        totalBruto,
        totalDomicilios,
        totalNeto,
        efectivoCierre,
        sellByWeight,
        hasActiveOrders,
        activeOrdersCount,
        isLoading,
        isClosing,
        handleClose,
    } = useCloseSalesPage();

    const categoryModal = useSalesByCategoryModal();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-64">
                <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!activeSale) {
        return (
            <div className="px-5 py-6 max-w-3xl mx-auto">
                <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-4">
                    <AlertCircle size={48} className="text-stone-300" />
                    <p className="text-lg font-medium text-stone-500">No hay una caja abierta actualmente</p>
                    <p className="text-sm">Abre la caja desde el dashboard para registrar ventas.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="px-5 py-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Cierre de caja</h1>
                    <p className="text-stone-500 text-sm mt-0.5">
                        Resumen de la sesión de ventas actual
                    </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Caja abierta
                </span>
            </div>

            {/* Summary cards */}
            <div className={`grid grid-cols-1 gap-4 mb-6 ${sellByWeight ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
                <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-4 shadow-sm">
                    <div className="p-2.5 rounded-xl bg-blue-100">
                        <DollarSign size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <p className="text-xs text-stone-500 font-medium">Efectivo inicial</p>
                        <p className="text-xl font-bold text-stone-900 mt-0.5">
                            {formatCurrency(efectivoInicio)}
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-4 shadow-sm">
                    <div className="p-2.5 rounded-xl bg-amber-100">
                        <TrendingUp size={20} className="text-amber-600" />
                    </div>
                    <div>
                        <p className="text-xs text-stone-500 font-medium">Ventas brutas</p>
                        <p className="text-xl font-bold text-stone-900 mt-0.5">
                            {formatCurrency(totalBruto)}
                        </p>
                    </div>
                </div>

                {sellByWeight && (
                    <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-4 shadow-sm">
                        <div className="p-2.5 rounded-xl bg-red-100">
                            <Bike size={20} className="text-red-500" />
                        </div>
                        <div>
                            <p className="text-xs text-stone-500 font-medium">Domicilios</p>
                            <p className="text-xl font-bold text-red-500 mt-0.5">
                                -{formatCurrency(totalDomicilios)}
                            </p>
                        </div>
                    </div>
                )}

                {sellByWeight && (
                    <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-4 shadow-sm">
                        <div className="p-2.5 rounded-xl bg-violet-100">
                            <TrendingUp size={20} className="text-violet-600" />
                        </div>
                        <div>
                            <p className="text-xs text-stone-500 font-medium">Ingreso neto</p>
                            <p className="text-xl font-bold text-violet-700 mt-0.5">
                                {formatCurrency(totalNeto)}
                            </p>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-4 shadow-sm">
                    <div className="p-2.5 rounded-xl bg-emerald-100">
                        <Wallet size={20} className="text-emerald-600" />
                    </div>
                    <div>
                        <p className="text-xs text-stone-500 font-medium">Efectivo en caja</p>
                        <p className="text-xl font-bold text-emerald-700 mt-0.5">
                            {formatCurrency(efectivoCierre)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Detail section */}
            <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-6 space-y-5">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-stone-100 mt-0.5">
                        <CalendarClock size={16} className="text-stone-600" />
                    </div>
                    <div>
                        <p className="text-xs text-stone-500 font-medium mb-0.5">Apertura de caja</p>
                        <p className="text-sm text-stone-800 font-medium capitalize">
                            {formatDate(activeSale.created_at)}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-stone-100 mt-0.5">
                        <User size={16} className="text-stone-600" />
                    </div>
                    <div>
                        <p className="text-xs text-stone-500 font-medium mb-0.5">Abierta por</p>
                        <p className="text-sm text-stone-800 font-medium">
                            {activeSale.user
                            ? `${activeSale.user.nombre} ${activeSale.user.apellido_paterno}`
                            : `Usuario #${activeSale.user_id}`}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-stone-100 mt-0.5">
                        <MessageSquare size={16} className="text-stone-600" />
                    </div>
                    <div>
                        <p className="text-xs text-stone-500 font-medium mb-0.5">Observaciones</p>
                        <p className="text-sm text-stone-800">
                            {activeSale.observaciones?.trim() || (
                                <span className="text-stone-400 italic">Sin observaciones</span>
                            )}
                        </p>
                    </div>
                </div>
            </div>

            {/* Más vendido del día */}
            <div className="flex items-start justify-between gap-4 mb-0">
                <div className="flex-1">
                    <BestSellerWidget sistemaId={sistemaId} />
                </div>
                {sellByWeight && (
                    <div className="shrink-0 pt-1">
                        <SalesByCategoryButton onClick={categoryModal.open} />
                    </div>
                )}
            </div>

            {/* Aviso de órdenes activas */}
            {hasActiveOrders && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-4">
                    <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">No puedes cerrar la caja</p>
                        <p className="text-sm text-amber-700 mt-0.5">
                            Tienes {activeOrdersCount} {activeOrdersCount === 1 ? "mesa activa" : "mesas activas"}. Finaliza todas las órdenes antes de cerrar.
                        </p>
                    </div>
                </div>
            )}

            {/* Close button */}
            <button
                onClick={handleClose}
                disabled={isClosing || hasActiveOrders}
                className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold px-6 py-3.5 rounded-2xl transition-colors text-sm"
            >
                <Lock size={16} />
                {isClosing ? "Cerrando caja..." : "Cerrar caja"}
            </button>

            <SalesByCategoryModal
                isOpen={categoryModal.isOpen}
                onClose={categoryModal.close}
                data={categoryModal.data}
                isLoading={categoryModal.isLoading}
                totalBruto={categoryModal.totalBruto}
                totalDomicilios={categoryModal.totalDomicilios}
                totalNeto={categoryModal.totalNeto}
                sistemaId={categoryModal.sistemaId}
            />
        </div>
    );
}
