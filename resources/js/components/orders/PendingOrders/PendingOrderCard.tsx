import { Check, X, Phone, MapPin, Store, Bike, Loader, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { usePendingOrderDetail } from "./usePendingOrderDetail";

interface PendingOrderCardProps {
    order: IOrder;
    isPending: boolean;
    onAccept: (order: IOrder) => void;
    onReject: (order: IOrder) => void;
}

export const PendingOrderCard = ({ order, isPending, onAccept, onReject }: PendingOrderCardProps) => {
    const { expanded, toggle, products, isLoading: loadingProducts } = usePendingOrderDetail(order.id);
    const isDelivery = !!order.is_delivery;

    return (
        <div className="bg-white border border-amber-200 rounded-2xl flex flex-col shadow-sm">
            <div className="p-4 flex flex-col gap-3 flex-1">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="font-semibold text-stone-800 text-sm">{order.nombre_pedido ?? "—"}</p>
                        {order.customer?.phone && (
                            <a
                                href={`tel:${order.customer.phone}`}
                                className="flex items-center gap-1 text-xs text-amber-600 hover:underline mt-0.5"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <Phone size={11} />
                                {order.customer.phone}
                            </a>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium shrink-0">
                        {isDelivery ? (
                            <span className="flex items-center gap-1 bg-blue-50 text-blue-600 px-2 py-1 rounded-full">
                                <Bike size={11} /> Domicilio
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
                                <Store size={11} /> Tienda
                            </span>
                        )}
                    </div>
                </div>

                {isDelivery && (order.delivery_address || order.delivery_reference) && (
                    <div className="flex items-start gap-1.5 text-xs text-stone-500 bg-stone-50 rounded-xl px-3 py-2">
                        <MapPin size={12} className="mt-0.5 shrink-0 text-stone-400" />
                        <div>
                            {order.delivery_address && <p>{order.delivery_address}</p>}
                            {order.delivery_reference && (
                                <p className="text-stone-400">{order.delivery_reference}</p>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                    <span className="text-sm font-bold text-stone-800 tabular-nums">
                        ${parseFloat(Number(order.total).toFixed(2))}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onReject(order)}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-stone-200 text-stone-600 hover:bg-stone-100 disabled:opacity-50 transition-colors"
                        >
                            {isPending ? <Loader size={12} className="animate-spin" /> : <X size={12} />}
                            Rechazar
                        </button>
                        <button
                            onClick={() => onAccept(order)}
                            disabled={isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                        >
                            {isPending ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                            Aceptar
                        </button>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={toggle}
                className="flex items-center justify-between px-4 py-2.5 border-t border-amber-100 bg-amber-50/50 hover:bg-amber-50 transition-colors rounded-b-2xl text-xs font-medium text-amber-700"
            >
                <span className="flex items-center gap-1.5">
                    <ShoppingBag size={12} />
                    Ver pedido
                </span>
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {expanded && (
                <div className="px-4 pb-4 pt-2 flex flex-col gap-1.5">
                    {loadingProducts ? (
                        <div className="flex justify-center py-3">
                            <Loader size={16} className="animate-spin text-amber-400" />
                        </div>
                    ) : products.length === 0 ? (
                        <p className="text-xs text-stone-400 text-center py-2">Sin productos</p>
                    ) : (
                        products.map((op) => (
                            <div key={op.id} className="flex items-start justify-between gap-2 text-xs text-stone-600">
                                <span className="flex-1">
                                    <span className="font-medium text-stone-700">{parseFloat(String(op.cantidad))}×</span>{" "}
                                    {op.product?.nombre ?? "Producto"}
                                    {op.observacion && (
                                        <p className="text-stone-400 mt-0.5 leading-tight">{op.observacion}</p>
                                    )}
                                </span>
                                <span className="tabular-nums shrink-0 text-stone-500">
                                    ${parseFloat((Number(op.precio) * op.cantidad).toFixed(2))}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};
