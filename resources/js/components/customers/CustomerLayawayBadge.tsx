import { Package } from "lucide-react";
import { ICustomer } from "@/models/ICustomer";
import { calcLayawayBalance } from "@/utils/layawayCalc";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";

interface CustomerLayawayBadgeProps {
    // Acepta un cliente del listado o un deudor del top de Estadísticas: ambos traen el mismo resumen.
    customer: Pick<ICustomer, "layaway_count" | "layaway_total" | "layaway_paid" | "layaway_overdue_count">;
}

// Indicador de apartados: el apartado no es adeudo de crédito, así que se muestra aparte — cuántos
// apartados activos tiene el cliente y cuánto le falta por pagar en total. Compartido por la tabla
// de Clientes y la de clientes con adeudo de Estadísticas.
export const CustomerLayawayBadge = ({ customer }: CustomerLayawayBadgeProps) => {
    const count = customer.layaway_count ?? 0;
    if (count === 0) return <span className="text-sm text-stone-300">—</span>;

    const pending = calcLayawayBalance(Number(customer.layaway_total ?? 0), Number(customer.layaway_paid ?? 0));
    const overdue = customer.layaway_overdue_count ?? 0;

    return (
        <span
            title={`${count} ${count === 1 ? "apartado activo" : "apartados activos"}${overdue > 0 ? `, ${overdue} vencido${overdue === 1 ? "" : "s"}` : ""}`}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium px-2 py-1 rounded-full ${overdue > 0 ? "bg-red-50 text-red-600" : "bg-purple-50 text-purple-700"}`}
        >
            <Package size={12} />
            {count} · {formatCurrencyTrimmed(pending)}
            {overdue > 0 && <span className="font-semibold">· {overdue} vencido{overdue === 1 ? "" : "s"}</span>}
        </span>
    );
};
