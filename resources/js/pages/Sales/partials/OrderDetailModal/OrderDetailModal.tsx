import { Modal } from "@mantine/core";
import { IOrder } from "@/models/IOrder";
import { Bike, Receipt } from "lucide-react";
import { getStatusStyle, getStatusLabel } from "@/pages/Dashboard/useDashboard";
import { PrintTicketButton } from "@/components/orders/PrintTicket/PrintTicketButton";
import { PaymentMethodBadge } from "@/components/orders/PaymentMethodBadge";
import { useAxios } from "@/hooks/useAxios";

interface OrderDetailModalProps {
    isOpen: boolean;
    order: IOrder | null;
    onClose: () => void;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("es-MX", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

export const OrderDetailModal = ({ isOpen, order, onClose }: OrderDetailModalProps) => {
    const { features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Receipt size={18} className="text-amber-500" />
                    <span className="font-semibold text-stone-800">Detalle de orden</span>
                </div>
            }
            size="sm"
            radius="lg"
            padding="lg"
        >
            {!order ? (
                <p className="text-center text-stone-400 py-8 text-sm">Sin información</p>
            ) : (
                <div className="space-y-5">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        <div>
                            <p className="text-xs text-stone-400 font-medium">Orden</p>
                            <p className="text-lg font-bold text-stone-900">{order.nombre_pedido}</p>
                            <p className="text-xs text-stone-400 mt-0.5">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusStyle(order.estatus_pedido_id)}`}>
                                {getStatusLabel(order.estatus_pedido_id)}
                            </span>
                            <PaymentMethodBadge name={order.payment_method?.name} />
                            <PrintTicketButton orderId={order.id} showLabel />
                        </div>
                    </div>

                    {/* Domicilio badge — solo negocios de venta por peso */}
                    {sellByWeight && (
                        Number(order.costo_domicilio) > 0 ? (
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl">
                                <Bike size={14} className="text-red-400 shrink-0" />
                                <span className="text-xs font-medium text-red-600">Envío a domicilio</span>
                                <span className="ml-auto text-xs font-semibold text-red-600">
                                    -{formatCurrency(Number(order.costo_domicilio))}
                                </span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 px-3 py-2 bg-stone-50 border border-stone-100 rounded-xl">
                                <Bike size={14} className="text-stone-300 shrink-0" />
                                <span className="text-xs text-stone-400">Sin envío a domicilio</span>
                            </div>
                        )
                    )}

                    {/* Totals */}
                    <div className="bg-stone-50 rounded-2xl border border-stone-100 p-4 space-y-3">
                        <div className="flex justify-between text-sm text-stone-500">
                            <span>Subtotal</span>
                            <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.descuento > 0 && (
                            <div className="flex justify-between text-sm text-emerald-600">
                                <span>Descuento ({order.descuento}%)</span>
                                <span>-{formatCurrency(order.subtotal * order.descuento / 100)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-stone-900 text-base pt-2 border-t border-stone-200">
                            <span>Total</span>
                            <span>{formatCurrency(order.total)}</span>
                        </div>
                        {sellByWeight && Number(order.costo_domicilio) > 0 && (
                            <>
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>Domicilio</span>
                                    <span>-{formatCurrency(Number(order.costo_domicilio))}</span>
                                </div>
                                <div className="flex justify-between font-bold text-violet-700 text-base pt-2 border-t border-stone-200">
                                    <span>Ingreso neto</span>
                                    <span>{formatCurrency(order.total - Number(order.costo_domicilio))}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};
