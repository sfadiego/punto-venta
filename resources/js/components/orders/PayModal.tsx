import { IPaymentMethod } from "@/models/IPaymentMethod";
import { PayModalHeader } from "./PayModal/PayModalHeader";
import { PayModalTotal } from "./PayModal/PayModalTotal";
import { PayMethodSelector } from "./PayModal/PayMethodSelector";
import { PayTransferAlert } from "./PayModal/PayTransferAlert";
import { PayCashInput } from "./PayModal/PayCashInput";
import { PayModalActions } from "./PayModal/PayModalActions";

interface PayModalProps {
    isOpen: boolean;
    subtotal: number;
    cash: string;
    setCash: (v: string) => void;
    change: number;
    canPay: boolean;
    isPending: boolean;
    paymentMethods: IPaymentMethod[];
    paymentMethodId: number | null;
    setPaymentMethodId: (id: number | null) => void;
    isCash: boolean;
    onPay: () => void;
    onClose: () => void;
}

export const PayModal = ({
    isOpen,
    subtotal,
    cash,
    setCash,
    change,
    canPay,
    isPending,
    paymentMethods,
    paymentMethodId,
    setPaymentMethodId,
    isCash,
    onPay,
    onClose,
}: PayModalProps) => {
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
