import { ReceiptText } from "lucide-react";
import { useRecentSales } from "./useRecentSales";
import { formatOrderTime } from "../useDashboard";
import { EmptyState } from "@/components/ui/interactions/EmptyState";
import { LoadingSkeleton } from "@/components/ui/interactions/LoadingSkeleton";
import { OrderPreviewModal } from "@/components/orders/OrderPreviewModal";
import { PrintTicketButton } from "@/components/orders/PrintTicketButton";
import { usePermissions } from "@/hooks/usePermissions";

export const RecentSales = () => {
    const { sales, total, isLoading, sistemaId } = useRecentSales();
    const { can } = usePermissions();

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <div className="flex items-center gap-2">
                    <ReceiptText size={16} className="text-stone-400" />
                    <h2 className="font-semibold text-stone-900 text-sm">Ventas del día</h2>
                </div>
                {total > 0 && (
                    <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">
                        {total} {total === 1 ? "venta" : "ventas"}
                    </span>
                )}
            </div>

            <div className="p-4">
                {!sistemaId ? (
                    <EmptyState message="No hay una caja abierta." />
                ) : isLoading ? (
                    <LoadingSkeleton />
                ) : sales.length === 0 ? (
                    <EmptyState message="Sin ventas en esta sesión." />
                ) : (
                    <div className="flex flex-col gap-2">
                        {sales.map((sale) => (
                            <div
                                key={sale.id}
                                className="flex items-center justify-between px-4 py-3 rounded-xl bg-stone-50 border border-stone-100"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                                        <ReceiptText size={14} className="text-emerald-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-stone-900">
                                            {sale.nombre_pedido ?? `Venta #${sale.id}`}
                                        </p>
                                        <p className="text-xs text-stone-400">
                                            {formatOrderTime(sale.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-sm font-bold text-emerald-600 mr-1">
                                        ${sale.total.toFixed(2)}
                                    </span>
                                    <OrderPreviewModal order={sale} />
                                    {can("printTicket") && <PrintTicketButton orderId={sale.id} />}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
