import { Banknote, CreditCard, Gift, HandCoins } from "lucide-react";
import { IPaymentMethod } from "@/models/IPaymentMethod";

interface PaymentMethodSelectorProps {
    paymentMethods: IPaymentMethod[];
    paymentMethodId: number | null;
    onSelect: (id: number) => void;
    /** Disponibilidad del modo crédito — la decide el caller (sell_by_weight siempre lo tiene,
     * restaurante depende de business_config.customers_enabled). */
    creditModeAvailable?: boolean;
    isCreditMode?: boolean;
    onSelectCredit?: () => void;
    label?: string;
    /** Apartados (solo retail): muestra la opción "Apartar" como alternativa al cobro completo. */
    layawayAvailable?: boolean;
    isLayawayMode?: boolean;
    onSelectLayaway?: () => void;
}

export const PaymentMethodSelector = ({
    paymentMethods,
    paymentMethodId,
    onSelect,
    creditModeAvailable = false,
    isCreditMode = false,
    onSelectCredit,
    label = "Método de pago",
    layawayAvailable = false,
    isLayawayMode = false,
    onSelectLayaway,
}: PaymentMethodSelectorProps) => {
    const activeMethods = paymentMethods.filter((m) => m.active);

    if (activeMethods.length === 0 && !creditModeAvailable && !layawayAvailable) return null;

    return (
        <div>
            <p className="text-xs text-stone-500 mb-2 text-left">{label}</p>
            <div className={layawayAvailable ? "flex gap-1.5" : "grid grid-cols-3 gap-1.5"}>
                {activeMethods.map((method) => {
                    const isSelected = !isCreditMode && method.id === paymentMethodId;
                    const isCash = method.name.toLowerCase().includes("efectivo");
                    return (
                        <button
                            key={method.id}
                            type="button"
                            onClick={() => onSelect(method.id)}
                            className={`flex flex-1 items-center justify-center gap-1 px-2 py-2 rounded-xl border text-xs font-medium transition-all duration-200 whitespace-nowrap ${
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
                        onClick={onSelectCredit}
                        className={`flex flex-1 items-center justify-center gap-1 px-2 py-2 rounded-xl border text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                            isCreditMode
                                ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                                : "bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:bg-amber-50"
                        }`}
                    >
                        <HandCoins size={13} />
                        Crédito
                    </button>
                )}
                {layawayAvailable && (
                    <button
                        type="button"
                        onClick={onSelectLayaway}
                        className={`flex flex-1 items-center justify-center gap-1 px-2 py-2 rounded-xl border text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                            isLayawayMode
                                ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                                : "bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:bg-amber-50"
                        }`}
                    >
                        <Gift size={13} />
                        Apartar
                    </button>
                )}
            </div>
        </div>
    );
};
