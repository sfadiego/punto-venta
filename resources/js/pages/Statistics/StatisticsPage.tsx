import { BarChart2, TrendingUp, ShoppingBag, Award, DollarSign, LockKeyhole } from "lucide-react";
import { useStatisticsPage } from "./useStatisticsPage";
import { BestSellerChart, BestSellerRanking, formatTotal } from "./partials/BestSellerChart";
import { MonthPicker } from "./partials/MonthPicker";

export default function StatisticsPage() {
    const { month, formattedMonth, bestSellers, isLoading, totalVentas, cajaAbierta, handleMonthChange } = useStatisticsPage();

    const topProduct = bestSellers[0];
    const allSameUnit = bestSellers.length > 0 && bestSellers.every((i) => i.unidad_medida === bestSellers[0].unidad_medida);
    const totalUnits = bestSellers.reduce((sum, item) => sum + item.total, 0);
    const totalLabel = allSameUnit ? formatTotal(totalUnits, bestSellers[0].unidad_medida) : `${totalUnits}`;

    return (
        <div className="px-5 py-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-stone-900">Estadísticas</h1>
                    <p className="text-stone-500 text-sm mt-0.5 capitalize">{formattedMonth}</p>
                </div>

                <div className="self-start sm:self-auto">
                    <MonthPicker value={month} onChange={handleMonthChange} />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-24">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : bestSellers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center gap-3 py-20">
                    <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center">
                        <BarChart2 size={26} className="text-stone-300" />
                    </div>
                    <p className="text-stone-500 font-medium">Sin ventas registradas</p>
                    <p className="text-stone-400 text-sm">No hay datos para el período seleccionado.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {/* Summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-start gap-4">
                            <div className={`p-2.5 rounded-xl shrink-0 ${cajaAbierta ? "bg-green-100" : "bg-stone-100"}`}>
                                {cajaAbierta
                                    ? <DollarSign size={20} className="text-green-600" />
                                    : <LockKeyhole size={20} className="text-stone-400" />
                                }
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-stone-500 font-medium">Ventas del día</p>
                                {cajaAbierta ? (
                                    <>
                                        <p className="text-base font-bold text-stone-900 mt-0.5 truncate">
                                            {totalVentas}
                                        </p>
                                        <p className="text-xs text-stone-400 mt-0.5">sesión actual</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-sm font-semibold text-stone-400 mt-0.5">Caja cerrada</p>
                                        <p className="text-xs text-stone-300 mt-0.5">sin sesión activa</p>
                                    </>
                                )}
                            </div>
                        </div>

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

                        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-start gap-4">
                            <div className="p-2.5 rounded-xl bg-emerald-100 shrink-0">
                                <ShoppingBag size={20} className="text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-stone-500 font-medium">Total vendido</p>
                                <p className="text-2xl font-bold text-stone-900 mt-0.5">{totalLabel}</p>
                                <p className="text-xs text-stone-400 mt-0.5">top {bestSellers.length} productos</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-start gap-4">
                            <div className="p-2.5 rounded-xl bg-blue-100 shrink-0">
                                <TrendingUp size={20} className="text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-stone-500 font-medium">Productos en ranking</p>
                                <p className="text-2xl font-bold text-stone-900 mt-0.5">{bestSellers.length}</p>
                                <p className="text-xs text-stone-400 mt-0.5">con mayor demanda</p>
                            </div>
                        </div>
                    </div>

                    {/* Chart + Ranking */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                        {/* Bar chart */}
                        <div className="lg:col-span-3 bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <BarChart2 size={17} className="text-amber-500" />
                                <h2 className="text-sm font-semibold text-stone-800">
                                    Productos más vendidos
                                </h2>
                            </div>
                            <BestSellerChart data={bestSellers} />
                        </div>

                        {/* Ranking */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <Award size={17} className="text-amber-500" />
                                <h2 className="text-sm font-semibold text-stone-800">Ranking</h2>
                            </div>
                            <BestSellerRanking data={bestSellers} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
