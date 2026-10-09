import { HandCoins, Users } from "lucide-react";
import { ITopDebtorsSummary } from "@/models/ITopDebtors";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";

// inset: tarjetas tenues para ir dentro de un contenedor blanco (Estadísticas).
// card: tarjetas blancas con borde y sombra para ir directo sobre el fondo de la página (Clientes).
const SURFACE_CLASSES = {
    inset: "bg-stone-50 border-stone-100",
    card: "bg-white border-stone-200 shadow-sm",
} as const;

interface DebtSummaryCardsProps {
    summary?: ITopDebtorsSummary;
    surface?: keyof typeof SURFACE_CLASSES;
}

// Resumen del adeudo de clientes (por cobrar y clientes con adeudo).
// Compartido por Estadísticas y la página de Clientes: recibe los datos por props.
export const DebtSummaryCards = ({ summary, surface = "inset" }: DebtSummaryCardsProps) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`${SURFACE_CLASSES[surface]} rounded-2xl border p-4 flex items-start gap-3`}>
            <div className="p-2.5 rounded-xl shrink-0 bg-red-100">
                <HandCoins size={18} className="text-red-600" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-stone-500 font-medium">Por cobrar</p>
                <p className="text-xl font-bold text-stone-900 mt-0.5 tabular-nums">{formatCurrencyTrimmed(summary?.total_balance ?? 0)}</p>
                <p className="text-xs text-stone-400 mt-0.5">adeudo total de clientes</p>
            </div>
        </div>

        <div className={`${SURFACE_CLASSES[surface]} rounded-2xl border p-4 flex items-start gap-3`}>
            <div className="p-2.5 rounded-xl shrink-0 bg-orange-100">
                <Users size={18} className="text-orange-600" />
            </div>
            <div className="min-w-0">
                <p className="text-xs text-stone-500 font-medium">Clientes con adeudo</p>
                <p className="text-xl font-bold text-stone-900 mt-0.5">{summary?.debtors_count ?? 0}</p>
                <p className="text-xs text-stone-400 mt-0.5">con saldo pendiente</p>
            </div>
        </div>
    </div>
);
