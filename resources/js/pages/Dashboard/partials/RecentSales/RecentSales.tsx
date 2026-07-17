import { ReceiptText, Clock, Loader } from "lucide-react";
import { useRecentSales } from "./useRecentSales";
import { formatOrderTime } from "../../useDashboard";
import { EmptyState } from "@/components/ui/interactions/EmptyState";
import { LoadingSkeleton } from "@/components/ui/interactions/LoadingSkeleton";
import { OrderPreviewModal } from "@/components/orders/OrderPreviewModal/OrderPreviewModal";
import { SaleActions } from "@/components/orders/OrderActions/SaleActions";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { IOrder } from "@/models/IOrder";

interface RecentSalesProps {
    onSelect?: (order: IOrder) => void;
}

export const RecentSales = ({ onSelect }: RecentSalesProps) => {
    const { sales, total, isLoading, isRefetching, sistemaId, sellByWeight } = useRecentSales();

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <div className="flex items-center gap-2">
                    <ReceiptText size={16} className="text-stone-400" />
                    <h2 className="font-semibold text-stone-900 text-sm">Ventas del día</h2>
                    {isRefetching && (
                        <Loader size={13} className="animate-spin text-amber-400" />
                    )}
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
                        {sales.map((sale) => {
                            const isPending = sale.estatus_pedido_id === OrderStatusEnum.InProcess;
                            const clickable = sellByWeight && isPending && !!onSelect;

                            return (
                                <div
                                    key={sale.id}
                                    onClick={clickable ? () => onSelect!(sale) : undefined}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl bg-stone-50 border transition-colors ${
                                        clickable
                                            ? "border-amber-200 cursor-pointer hover:bg-amber-50 hover:border-amber-300"
                                            : "border-stone-100"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            isPending ? "bg-amber-100" : "bg-emerald-100"
                                        }`}>
                                            {isPending
                                                ? <Clock size={14} className="text-amber-600" />
                                                : <ReceiptText size={14} className="text-emerald-600" />
                                            }
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-stone-900">
                                                {sale.nombre_pedido ?? `Pedido #${sale.id}`}
                                            </p>
                                            <p className="text-xs text-stone-400">
                                                {formatOrderTime(sale.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className={`text-sm font-bold mr-1 ${
                                            isPending ? "text-amber-600" : "text-emerald-600"
                                        }`}>
                                            ${sale.total.toFixed(2)}
                                        </span>
                                        {sellByWeight
                                            ? <SaleActions order={sale} />
                                            : <OrderPreviewModal order={sale} />
                                        }
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
