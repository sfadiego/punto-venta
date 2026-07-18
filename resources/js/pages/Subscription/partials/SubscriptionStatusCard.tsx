import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";

interface SubscriptionStatusCardProps {
    status: SubscriptionStatusEnum;
    daysRemaining: number | null;
}

const STATUS_CONFIG: Record<SubscriptionStatusEnum, { icon: React.ReactNode; label: string; color: string }> = {
    [SubscriptionStatusEnum.Active]: {
        icon:  <CheckCircle size={18} />,
        label: "Suscripción activa",
        color: "bg-emerald-50 border-emerald-200 text-emerald-700",
    },
    [SubscriptionStatusEnum.Grace]: {
        icon:  <AlertTriangle size={18} />,
        label: "Período de gracia",
        color: "bg-amber-50 border-amber-200 text-amber-700",
    },
    [SubscriptionStatusEnum.Expired]: {
        icon:  <XCircle size={18} />,
        label: "Suscripción vencida",
        color: "bg-red-50 border-red-200 text-red-700",
    },
    [SubscriptionStatusEnum.Pending]: {
        icon:  <Clock size={18} />,
        label: "Sin suscripción activa",
        color: "bg-slate-50 border-slate-200 text-slate-500",
    },
};

export const SubscriptionStatusCard = ({ status, daysRemaining }: SubscriptionStatusCardProps) => {
    const cfg = STATUS_CONFIG[status];
    return (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${cfg.color}`}>
            <span className="shrink-0">{cfg.icon}</span>
            <div>
                <p className="font-semibold text-sm">{cfg.label}</p>
                {status === SubscriptionStatusEnum.Grace && (
                    <p className="text-xs opacity-80 mt-0.5">
                        Tu acceso se mantendrá activo por unos días más mientras regularizas el pago.
                    </p>
                )}
                {status === SubscriptionStatusEnum.Active && daysRemaining !== null && daysRemaining <= 7 && (
                    <p className="text-xs opacity-80 mt-0.5">
                        Vence pronto — considera renovar para no perder el acceso.
                    </p>
                )}
            </div>
        </div>
    );
};
