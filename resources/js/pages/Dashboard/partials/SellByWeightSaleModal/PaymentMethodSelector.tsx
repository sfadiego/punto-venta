import { Banknote, CreditCard, HandCoins } from "lucide-react";
import { IPaymentMethod } from "@/models/IPaymentMethod";

interface PaymentMethodSelectorProps {
    paymentMethods: IPaymentMethod[];
    paymentMethodId: number | null;
    setPaymentMethodId: (id: number | null) => void;
    isCreditMode: boolean;
    setIsCreditMode: (v: boolean) => void;
    creditModeAvailable: boolean;
}

export const PaymentMethodSelector = ({
    paymentMethods, paymentMethodId, setPaymentMethodId, isCreditMode, setIsCreditMode, creditModeAvailable,
}: PaymentMethodSelectorProps) => {
    const activeMethods = paymentMethods.filter((m) => m.active);

    if (activeMethods.length === 0 && !creditModeAvailable) return null;

    return (
        <div>
            <p className="text-xs text-stone-500 mb-2 text-left">Método de pago</p>
            <div className="grid grid-cols-3 gap-1.5">
                {activeMethods.map((method) => {
                    const isSelected = !isCreditMode && method.id === paymentMethodId;
                    const isCash = method.name.toLowerCase().includes("efectivo");
                    return (
                        <button
                            key={method.id}
                            type="button"
                            onClick={() => {
                                setIsCreditMode(false);
                                setPaymentMethodId(method.id);
                            }}
                            className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl border text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                                isSelected
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                    : "bg-white border-stone-200 text-stone-600 hover:border-emerald-300 hover:bg-emerald-50"
                            }`}
                        >
                            {isCash ? <Banknote size={13} /> : <CreditCard size={13} />}
                            {method.name}
                        </button>
                    );
                })}
                {creditModeAvailable && (
                    <button
                        type="button"
                        onClick={() => {
                            setIsCreditMode(true);
                            setPaymentMethodId(null);
                        }}
                        className={`flex items-center justify-center gap-1 px-2 py-2 rounded-xl border text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                            isCreditMode
                                ? "bg-emerald-500 border-emerald-500 text-white shadow-sm"
                                : "bg-white border-stone-200 text-stone-600 hover:border-emerald-300 hover:bg-emerald-50"
                        }`}
                    >
                        <HandCoins size={13} />
                        Crédito
                    </button>
                )}
            </div>
        </div>
    );
};
