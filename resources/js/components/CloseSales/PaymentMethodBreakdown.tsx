import { Banknote, CreditCard } from "lucide-react";

interface PaymentMethodTotalItem {
    payment_method_id: number | null;
    name: string;
    total: number;
}

interface PaymentMethodBreakdownProps {
    items: PaymentMethodTotalItem[];
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value);

const isCashMethod = (name: string) => name.toLowerCase().includes("efectivo");

export const PaymentMethodBreakdown = ({ items }: PaymentMethodBreakdownProps) => {
    if (items.length === 0) return null;

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 mb-6">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
                Desglose por método de pago
            </p>
            <div className="space-y-2">
                {items.map((item) => {
                    const cash = isCashMethod(item.name);
                    return (
                        <div
                            key={item.payment_method_id ?? "sin-metodo"}
                            className="flex items-center justify-between py-2 border-b border-stone-50 last:border-0"
                        >
                            <div className="flex items-center gap-2 text-stone-700">
                                {cash ? (
                                    <Banknote size={16} className="text-emerald-500" />
                                ) : (
                                    <CreditCard size={16} className="text-blue-500" />
                                )}
                                <span className="text-sm font-medium">{item.name}</span>
                            </div>
                            <span className={`text-sm font-bold tabular-nums ${cash ? "text-emerald-700" : "text-blue-700"}`}>
                                {formatCurrency(item.total)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
