import { Package } from "lucide-react";
import { ICustomer } from "@/models/ICustomer";
import { calcLayawayBalance } from "@/utils/layawayCalc";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";

interface CustomerLayawayBadgeProps {
    customer: ICustomer;
}

// Indicador de la tabla de Clientes: el apartado no es adeudo de crédito, así que se muestra
// aparte — cuántos apartados activos tiene y cuánto le falta por pagar en total.
export const CustomerLayawayBadge = ({ customer }: CustomerLayawayBadgeProps) => {
    const count = customer.layaway_count ?? 0;
    if (count === 0) return <span className="text-sm text-stone-300">—</span>;

    const pending = calcLayawayBalance(Number(customer.layaway_total ?? 0), Number(customer.layaway_paid ?? 0));

    return (
        <span
            title={`${count} ${count === 1 ? "apartado activo" : "apartados activos"}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full bg-purple-50 text-purple-700"
        >
            <Package size={12} />
            {count} · {formatCurrencyTrimmed(pending)}
        </span>
    );
};
