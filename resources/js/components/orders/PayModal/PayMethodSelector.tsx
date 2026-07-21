import { Banknote, CreditCard, Landmark } from "lucide-react";
import { IPaymentMethod } from "@/models/IPaymentMethod";

interface PayMethodSelectorProps {
    paymentMethods: IPaymentMethod[];
    paymentMethodId: number | null;
    onSelect: (id: number) => void;
    creditModeAvailable?: boolean;
    isCreditMode?: boolean;
    onSelectCredit?: () => void;
}

export const PayMethodSelector = ({
    paymentMethods,
    paymentMethodId,
    onSelect,
    creditModeAvailable = false,
    isCreditMode = false,
    onSelectCredit,
}: PayMethodSelectorProps) => {
    const activeMethods = paymentMethods.filter((m) => m.active);

    if (activeMethods.length === 0 && !creditModeAvailable) return null;

    return (
        <div>
            <p className="text-xs text-stone-500 mb-2 text-left">Método de pago</p>
            <div className="flex gap-2 flex-wrap">
                {activeMethods.map((method) => {
                    const isSelected = !isCreditMode && method.id === paymentMethodId;
                    const isCash = method.name.toLowerCase().includes("efectivo");
                    return (
                        <button
                            key={method.id}
                            type="button"
                            onClick={() => onSelect(method.id)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                                isSelected
                                    ? "bg-emerald-500 border-emerald-500 text-white shadow-sm scale-105"
                                    : "bg-white border-stone-200 text-stone-600 hover:border-emerald-300 hover:bg-emerald-50"
                            }`}
                        >
                            {isCash ? <Banknote size={14} /> : <CreditCard size={14} />}
                            {method.name}
                        </button>
                    );
                })}
                {creditModeAvailable && (
                    <button
                        type="button"
                        onClick={onSelectCredit}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all duration-200 ${
                            isCreditMode
                                ? "bg-amber-500 border-amber-500 text-white shadow-sm scale-105"
                                : "bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:bg-amber-50"
                        }`}
                    >
                        <Landmark size={14} />
                        Crédito
                    </button>
                )}
            </div>
        </div>
    );
};
