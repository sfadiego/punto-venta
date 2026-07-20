import { useState } from "react";
import { Eye, Trash2, Loader, DollarSign } from "lucide-react";
import { PrintTicketButton } from "../PrintTicket/PrintTicketButton";
import { OrderDetailModal } from "@/pages/Sales/partials/OrderDetailModal/OrderDetailModal";
import { SellByWeightPayModal } from "@/pages/Dashboard/partials/SellByWeightSaleModal/SellByWeightPayModal";
import { usePermissions } from "@/hooks/usePermissions";
import { useAxios } from "@/hooks/useAxios";
import { useOrderActions } from "./useOrderActions";
import { useSaleQuickPay } from "./useSaleQuickPay";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

interface SaleActionsProps {
    order: IOrder;
}

export const SaleActions = ({ order }: SaleActionsProps) => {
    const { can } = usePermissions();
    const { features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;
    const [detailOpen, setDetailOpen] = useState(false);
    const { handleDelete, isDeleting } = useOrderActions(order);

    const isClosed = order.estatus_pedido_id === OrderStatusEnum.Closed;
    const isInProcess = order.estatus_pedido_id === OrderStatusEnum.InProcess;

    const {
        isOpen: payOpen, totalFinal,
        cash, setCash, cashNum, change, canPay, isPaying,
        paymentMethods, paymentMethodId, setPaymentMethodId, isCashMethod,
        isCreditMode, setIsCreditMode, customers, selectedCustomerId, setSelectedCustomerId,
        openPayModal, closePayModal, handlePay,
    } = useSaleQuickPay(order);

    return (
        <div
            className="flex items-center justify-center gap-1"
            onClick={(e) => e.stopPropagation()}
        >
            {isInProcess && (
                <button
                    onClick={openPayModal}
                    disabled={order.total === 0}
                    title="Cobrar"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400
                            hover:text-emerald-600 hover:bg-emerald-50 border border-transparent
                            hover:border-emerald-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <DollarSign size={20} />
                </button>
            )}

            {isClosed && (
                <button
                    onClick={() => setDetailOpen(true)}
                    title="Ver detalle"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400
                            hover:text-orange-600 hover:bg-orange-50 border border-transparent
                            hover:border-orange-200 transition-all"
                >
                    <Eye size={20} />
                </button>
            )}

            {can("printTicket") && <PrintTicketButton orderId={order.id} />}

            {can("deleteOrder") && !isClosed && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    title="Eliminar orden"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-stone-400
                            hover:text-red-600 hover:bg-red-50 border border-transparent
                            hover:border-red-200 transition-all disabled:opacity-50"
                >
                    {isDeleting
                        ? <Loader size={20} className="animate-spin text-red-500" />
                        : <Trash2 size={20} />
                    }
                </button>
            )}

            {isClosed && (
                <OrderDetailModal
                    isOpen={detailOpen}
                    order={order}
                    onClose={() => setDetailOpen(false)}
                />
            )}

            {payOpen && (
                <SellByWeightPayModal
                    totalFinal={totalFinal}
                    cash={cash}
                    setCash={setCash}
                    cashNum={cashNum}
                    change={change}
                    canPay={canPay}
                    isPaying={isPaying}
                    paymentMethods={paymentMethods}
                    paymentMethodId={paymentMethodId}
                    setPaymentMethodId={setPaymentMethodId}
                    isCashMethod={isCashMethod}
                    creditModeAvailable={sellByWeight}
                    isCreditMode={isCreditMode}
                    setIsCreditMode={setIsCreditMode}
                    customers={customers}
                    selectedCustomerId={selectedCustomerId}
                    setSelectedCustomerId={setSelectedCustomerId}
                    onConfirm={handlePay}
                    onClose={closePayModal}
                />
            )}
        </div>
    );
};
