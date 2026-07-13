import { Banknote, CreditCard } from "lucide-react";

interface PaymentMethodBadgeProps {
    name: string | null | undefined;
}

const isCash = (name: string) => name.toLowerCase().includes("efectivo");

export const PaymentMethodBadge = ({ name }: PaymentMethodBadgeProps) => {
    if (!name) {
        return <span className="text-stone-400 text-xs">—</span>;
    }

    const cash = isCash(name);

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                cash
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-blue-100 text-blue-700"
            }`}
        >
            {cash ? <Banknote size={11} /> : <CreditCard size={11} />}
            {name}
        </span>
    );
};
