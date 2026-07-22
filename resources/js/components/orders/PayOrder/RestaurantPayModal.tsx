import { IPaymentMethod } from "@/models/IPaymentMethod";
import { ICustomer } from "@/models/ICustomer";
import { PayModalHeader } from "../PayModal/PayModalHeader";
import { PayModalTotal } from "../PayModal/PayModalTotal";
import { PayMethodSelector } from "../PayModal/PayMethodSelector";
import { PayTransferAlert } from "../PayModal/PayTransferAlert";
import { PayCashInput } from "../PayModal/PayCashInput";
import { PayPropinaInput } from "../PayModal/PayPropinaInput";
import { PayModalActions } from "../PayModal/PayModalActions";
import { CustomerCreditPicker } from "@/pages/Dashboard/partials/SellByWeightSaleModal/CustomerCreditPicker";
import { useAxios } from "@/hooks/useAxios";

interface RestaurantPayModalProps {
    isOpen: boolean;
    subtotal: number;
    cash: string;
    setCash: (v: string) => void;
    change: number;
    canPay: boolean;
    isPending: boolean;
    propina: string;
    setPropina: (v: string) => void;
    paymentMethods: IPaymentMethod[];
    paymentMethodId: number | null;
    isCash: boolean;
    isCreditMode?: boolean;
    selectedCustomerId?: number | null;
    customers?: ICustomer[];
    onPay: () => void;
    onClose: () => void;
    onSelectMethod: (id: number) => void;
    onSelectCredit?: () => void;
    onSelectCustomer?: (id: number) => void;
}

export const RestaurantPayModal = ({
    isOpen,
    subtotal,
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
    isCreditMode = false,
    selectedCustomerId = null,
    customers = [],
    onPay,
    onClose,
    onSelectMethod,
    onSelectCredit,
    onSelectCustomer = () => {},
}: RestaurantPayModalProps) => {
    const { features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <PayModalHeader onClose={onClose} />

                <div className="p-5 space-y-4">
                    <PayModalTotal subtotal={subtotal} />

                    <PayMethodSelector
                        paymentMethods={paymentMethods}
                        paymentMethodId={paymentMethodId}
                        onSelect={onSelectMethod}
                        creditModeAvailable={sellByWeight && !!onSelectCredit}
                        isCreditMode={sellByWeight && isCreditMode}
                        onSelectCredit={sellByWeight ? onSelectCredit : undefined}
                    />

                    {sellByWeight && isCreditMode ? (
                        <CustomerCreditPicker
                            customers={customers}
                            selectedCustomerId={selectedCustomerId}
                            onSelect={onSelectCustomer}
                        />
                    ) : (
                        <>
                            <PayTransferAlert isCash={isCash} />

                            <PayPropinaInput
                                isCash={isCash}
                                subtotal={subtotal}
                                propina={propina}
                                setPropina={setPropina}
                            />

                            <PayCashInput
                                isCash={isCash}
                                cash={cash}
                                setCash={setCash}
                                change={change}
                                max={Math.ceil(subtotal * 10)}
                            />
                        </>
                    )}

                    <PayModalActions
                        canPay={canPay}
                        isPending={isPending}
                        onPay={onPay}
                        onClose={onClose}
                        confirmLabel={isCreditMode ? "Registrar venta a crédito" : "Pagar y cerrar"}
                    />
                </div>
            </div>
        </div>
    );
};
