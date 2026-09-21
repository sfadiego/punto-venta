import { IDashboardExpiringSubscription } from "@/models/IDashboard";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";

interface ExpiringSubscriptionsCardProps {
    subscriptions: IDashboardExpiringSubscription[];
}

// Días restantes → color del badge: hoy/mañana en rojo, hasta 3 días en ámbar, el resto neutro.
const badgeColor = (daysRemaining: number | null) => {
    if (daysRemaining === null) return "text-slate-500 bg-slate-100";
    if (daysRemaining <= 1) return "text-red-600 bg-red-50";
    if (daysRemaining <= 3) return "text-amber-600 bg-amber-50";
    return "text-slate-500 bg-slate-100";
};

const badgeLabel = (daysRemaining: number | null) => {
    if (daysRemaining === null) return "—";
    if (daysRemaining <= 0) return "Vence hoy";
    if (daysRemaining === 1) return "Vence mañana";
    return `${daysRemaining} días`;
};

export const ExpiringSubscriptionsCard = ({ subscriptions }: ExpiringSubscriptionsCardProps) => (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Suscripciones por vencer (7 días)</h2>
        {subscriptions.length === 0 ? (
            <p className="text-sm text-slate-400">Ninguna suscripción vence pronto.</p>
        ) : (
            <div className="flex flex-col">
                {subscriptions.map((sub) => (
                    <div
                        key={sub.id}
                        className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0"
                    >
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{sub.business_name}</p>
                            <p className="text-xs text-slate-400">
                                {sub.subscription_plan ?? "Sin plan"}
                                {sub.subscription_amount ? ` · ${formatCurrencyTrimmed(sub.subscription_amount)}` : ""}
                            </p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${badgeColor(sub.days_remaining)}`}>
                            {badgeLabel(sub.days_remaining)}
                        </span>
                    </div>
                ))}
            </div>
        )}
    </div>
);
