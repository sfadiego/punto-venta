import { IPaymentMethod } from "@/models/IPaymentMethod";
import { PayModalHeader } from "../PayModal/PayModalHeader";
import { PayModalTotal } from "../PayModal/PayModalTotal";
import { PayMethodSelector } from "../PayModal/PayMethodSelector";
import { PayTransferAlert } from "../PayModal/PayTransferAlert";
import { PayCashInput } from "../PayModal/PayCashInput";
import { PayPropinaInput } from "../PayModal/PayPropinaInput";
import { PayModalActions } from "../PayModal/PayModalActions";

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
    setPaymentMethodId: (id: number | null) => void;
    isCash: boolean;
    onPay: () => void;
    onClose: () => void;
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
    setPaymentMethodId,
    isCash,
    onPay,
    onClose,
}: RestaurantPayModalProps) => {
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
                        onSelect={setPaymentMethodId}
                    />

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

                    <PayModalActions
                        canPay={canPay}
                        isPending={isPending}
                        onPay={onPay}
                        onClose={onClose}
                    />
                </div>
            </div>
        </div>
    );
};
