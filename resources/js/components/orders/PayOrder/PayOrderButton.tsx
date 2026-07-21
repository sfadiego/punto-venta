import { Banknote } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { usePayOrder } from "./usePayOrder";
import { RestaurantPayModal } from "./RestaurantPayModal";

interface PayOrderButtonProps {
    order: IOrder;
    onSuccess?: () => void;
    showLabel?: boolean;
    className?: string;
}

export const PayOrderButton = ({
    order,
    onSuccess,
    showLabel = true,
    className,
}: PayOrderButtonProps) => {
    const {
        isOpen,
        cash,
        setCash,
        change,
        canPay,
        isPending,
        propina,
        setPropina,
        paymentMethods,
        paymentMethodId,
        isCash,
        isCreditMode,
        selectedCustomerId,
        setSelectedCustomerId,
        customers,
        handleOpen,
        handleClose,
        handlePay,
        handleSelectCredit,
        handleSelectMethod,
    } = usePayOrder(order, onSuccess);

    const isPayable =
        [OrderStatusEnum.InProcess, OrderStatusEnum.Served].includes(order.estatus_pedido_id) &&
        order.total > 0;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        handleOpen();
    };

    const defaultClass =
        "flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed";

    return (
        <>
            <button
                onClick={handleClick}
                disabled={!isPayable}
                title="Pagar"
                className={className ?? defaultClass}
            >
                <Banknote size={20} />
                {showLabel && <span className="hidden sm:inline">Pagar</span>}
            </button>

            <RestaurantPayModal
                isOpen={isOpen}
                subtotal={order.total}
                cash={cash}
                setCash={setCash}
                change={change}
                canPay={canPay}
                isPending={isPending}
                propina={propina}
                setPropina={setPropina}
                paymentMethods={paymentMethods}
                paymentMethodId={paymentMethodId}
                isCash={isCash}
                isCreditMode={isCreditMode}
                selectedCustomerId={selectedCustomerId}
                customers={customers}
                onPay={handlePay}
                onClose={handleClose}
                onSelectMethod={handleSelectMethod}
                onSelectCredit={handleSelectCredit}
                onSelectCustomer={setSelectedCustomerId}
            />
        </>
    );
};

