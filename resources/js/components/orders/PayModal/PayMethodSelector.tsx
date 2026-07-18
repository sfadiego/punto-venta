import { Banknote, CreditCard } from "lucide-react";
import { IPaymentMethod } from "@/models/IPaymentMethod";

interface PayMethodSelectorProps {
    paymentMethods: IPaymentMethod[];
    paymentMethodId: number | null;
    onSelect: (id: number) => void;
}

export const PayMethodSelector = ({ paymentMethods, paymentMethodId, onSelect }: PayMethodSelectorProps) => {
    const activeMethods = paymentMethods.filter((m) => m.active);

    if (activeMethods.length === 0) return null;

    return (
        <div>
            <p className="text-xs text-stone-500 mb-2 text-left">Método de pago</p>
            <div className="flex gap-2 flex-wrap">
                {activeMethods.map((method) => {
                    const isSelected = method.id === paymentMethodId;
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
            </div>
        </div>
    );
};
