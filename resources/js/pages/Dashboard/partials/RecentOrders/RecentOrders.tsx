import { IOrder } from "@/models/IOrder";
import { ArrowRight, ClipboardList, Loader } from "lucide-react";
import { OrderCard } from "./OrderCard";
import { EmptyState } from "@/components/ui/interactions/EmptyState";
import { LoadingSkeleton } from "@/components/ui/interactions/LoadingSkeleton";

interface RecentOrdersProps {
    orders: IOrder[];
    isLoading: boolean;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    sistemaId: number | null;
    onViewAll: () => void;
    onLoadMore: () => void;
}

export const RecentOrders = ({
    orders,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    sistemaId,
    onViewAll,
    onLoadMore,
}: RecentOrdersProps) => {
    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <div className="flex items-center gap-2">
                    <ClipboardList size={16} className="text-stone-400" />
                    <h2 className="font-semibold text-stone-900 text-sm">Órdenes recientes</h2>
                </div>
                <button
                    onClick={onViewAll}
                    className="flex items-center gap-1 text-amber-600 hover:text-amber-700 text-xs font-medium transition-colors"
                >
                    Ver todas
                    <ArrowRight size={13} />
                </button>
            </div>

            <div className="p-4">
                {!sistemaId ? (
                    <EmptyState message="No hay una caja abierta." />
                ) : isLoading ? (
                    <LoadingSkeleton />
                ) : orders.length === 0 ? (
                    <EmptyState message="No hay órdenes en esta sesión." />
                ) : (
                    <>
                        <div className="flex flex-col gap-2">
                            {orders.map((order) => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>

                        {hasNextPage && (
                            <button
                                onClick={onLoadMore}
                                disabled={isFetchingNextPage}
                                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                                    text-sm font-medium text-stone-500 hover:text-stone-700
                                    bg-stone-50 hover:bg-stone-100 border border-stone-200
                                    transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isFetchingNextPage ? (
                                    <>
                                        <Loader size={14} className="animate-spin" />
                                        Cargando...
                                    </>
                                ) : (
                                    "Cargar más"
                                )}
                            </button>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
