import { X, MessageSquare, Loader, Eye, CheckCircle2, Circle, Bike } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { IOrderProduct } from "@/models/IOrderProduct";
import { useOrderPreviewModal } from "./useOrderPreviewModal";
import { useAxios } from "@/hooks/useAxios";
import { UnidadMedidaEnum, UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";

const formatCantidad = (item: IOrderProduct): string => {
    const unidad = item.product?.unidad_medida;
    const esPeso = unidad === UnidadMedidaEnum.Kg || unidad === UnidadMedidaEnum.Gr;
    if (!esPeso) return String(parseFloat(item.cantidad.toString()));
    const n = parseFloat(item.cantidad.toString());
    const formatted = n % 1 === 0 ? String(n) : String(parseFloat(n.toFixed(3)));
    return `${formatted} ${UNIDAD_LABELS[unidad]}`;
};

interface OrderPreviewModalProps {
    order: IOrder;
}

export const OrderPreviewModal = ({ order }: OrderPreviewModalProps) => {
    const { isOpen, open, close, products, isLoading, isServed, isUpdatingStatus, readyCount, totalCount, allReady, markServed, toggleProductReady } = useOrderPreviewModal(order.id);
    const { features } = useAxios();
    const showOrderServed = features?.order_served !== false;
    const sellByWeight = features?.sell_by_weight === true;

    return (
        <>
            <button
                onClick={(e) => { e.stopPropagation(); open(); }}
                title="Ver detalle"
                className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400 hover:text-orange-600 hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-all"
            >
                <Eye size={13} />
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
                    onClick={close}
                >
                    <div
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-orange-100">
                                    <Eye size={16} className="text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-stone-900">{order.nombre_pedido}</p>
                                    <p className="text-xs text-stone-400">Detalle de orden</p>
                                </div>
                            </div>
                            <button
                                onClick={close}
                                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Acción */}
                        {showOrderServed && (
                            <div className="px-5 py-3 border-b border-stone-100 shrink-0">
                                <button
                                    onClick={markServed}
                                    disabled={isServed || !allReady || isUpdatingStatus}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                                        isServed
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default"
                                            : allReady
                                              ? "bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                              : "bg-stone-100 text-stone-400 cursor-not-allowed"
                                    }`}
                                >
                                    {isUpdatingStatus
                                        ? <Loader size={15} className="animate-spin" />
                                        : <CheckCircle2 size={15} />
                                    }
                                    {isServed
                                        ? "Orden servida ✓"
                                        : allReady
                                          ? "Marcar orden como servida"
                                          : `${readyCount}/${totalCount} listos`
                                    }
                                </button>
                            </div>
                        )}

                        {/* Domicilio — solo negocios de venta por peso */}
                        {sellByWeight && Number(order.costo_domicilio) > 0 && (
                            <div className="px-5 py-2.5 border-b border-stone-100 shrink-0">
                                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
                                    <Bike size={13} className="text-red-400 shrink-0" />
                                    <span className="text-xs font-medium text-red-600">Envío a domicilio</span>
                                    <span className="ml-auto text-xs font-semibold text-red-600">
                                        -${Number(order.costo_domicilio).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Productos */}
                        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
                            {isLoading ? (
                                <div className="flex justify-center py-8">
                                    <Loader size={20} className="animate-spin text-stone-400" />
                                </div>
                            ) : products.length === 0 ? (
                                <p className="text-sm text-stone-400 italic text-center py-8">
                                    Sin productos en esta orden
                                </p>
                            ) : (
                                products.map((item, idx) => (
                                    <div
                                        key={item.id ?? idx}
                                        className={`flex gap-3 p-3 rounded-xl border transition-colors ${
                                            item.is_ready
                                                ? "bg-emerald-50 border-emerald-200"
                                                : "bg-stone-50 border-stone-100"
                                        }`}
                                    >
                                        <div className={`min-w-[2.5rem] h-7 px-2 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold whitespace-nowrap ${
                                            item.is_ready ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                                        }`}>
                                            {formatCantidad(item)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold ${item.is_ready ? "text-emerald-700 line-through decoration-emerald-400/60" : "text-stone-900"}`}>
                                                {item.nombre_extra ?? item.product?.nombre ?? "—"}
                                            </p>
                                            {item.observacion && (
                                                <div className="flex items-start gap-1 mt-1">
                                                    <MessageSquare size={11} className="text-amber-500 mt-0.5 shrink-0" />
                                                    <p className="text-xs text-amber-700 bg-amber-50 rounded-md px-2 py-0.5">
                                                        {item.observacion}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => item.id !== undefined && toggleProductReady(item.id!)}
                                            title={item.is_ready ? "Marcar como pendiente" : "Marcar como listo"}
                                            className="shrink-0 self-center transition-colors"
                                        >
                                            {item.is_ready
                                                ? <CheckCircle2 size={20} className="text-emerald-500" />
                                                : <Circle size={20} className="text-stone-300 hover:text-emerald-400" />
                                            }
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
