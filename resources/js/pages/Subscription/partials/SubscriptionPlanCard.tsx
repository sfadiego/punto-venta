import { CreditCard, Calendar, Clock } from "lucide-react";
import { Row, Divider } from "./SubscriptionRow";

interface SubscriptionPlanCardProps {
    planLabel: string | null;
    expiresLabel: string | null;
    daysRemaining: number | null;
    isLifetime: boolean;
}

const formatDaysRemaining = (days: number): string => {
    if (days >= 0) return `${days} día${days !== 1 ? "s" : ""}`;
    const abs = Math.abs(days);
    return `Venció hace ${abs} día${abs !== 1 ? "s" : ""}`;
};

export const SubscriptionPlanCard = ({ planLabel, expiresLabel, daysRemaining, isLifetime }: SubscriptionPlanCardProps) => (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex flex-col gap-4">
        <Row
            icon={<CreditCard size={15} className="text-amber-500" />}
            label="Plan activo"
            value={planLabel ?? "Sin plan"}
        />
        <Divider />
        <Row
            icon={<Calendar size={15} className="text-amber-500" />}
            label="Fecha de vencimiento"
            value={isLifetime ? "Indefinida" : (expiresLabel ?? "—")}
        />
        {daysRemaining !== null && !isLifetime && (
            <>
                <Divider />
                <Row
                    icon={<Clock size={15} className="text-amber-500" />}
                    label="Días restantes"
                    value={formatDaysRemaining(daysRemaining)}
                />
            </>
        )}
    </div>
);
