import { CreditCard, Calendar, Clock, ChevronRight, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";
import { SubscriptionPlanEnum, PLAN_LABELS } from "@/enums/SubscriptionPlanEnum";

interface SubscriptionStatusResponse {
    status: SubscriptionStatusEnum;
    plan: SubscriptionPlanEnum | null;
    days_remaining: number | null;
    expires_at: string | null;
}

export const SubscriptionInfoSection = () => {
    const { data, isLoading } = useGET<SubscriptionStatusResponse>({
        url: `${ApiRoutes.BusinessConfig}/subscription-status`,
        nameQuery: "subscription-detail",
    });

    if (isLoading) return null;
    if (!data) return null;

    const planLabel = data.plan ? PLAN_LABELS[data.plan] : "Sin plan";

    const expiresLabel = data.expires_at
        ? new Date(data.expires_at + "T00:00:00").toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "long",
              year: "numeric",
          })
        : null;

    const showLink =
        data.status === SubscriptionStatusEnum.Grace ||
        data.status === SubscriptionStatusEnum.Expired ||
        (data.status === SubscriptionStatusEnum.Active &&
            data.days_remaining !== null &&
            data.days_remaining <= 7);

    return (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-semibold text-stone-700">Suscripción</h2>
                    <p className="text-xs text-stone-400">Estado actual de tu plan</p>
                </div>
                <StatusBadge status={data.status} />
            </div>

            <div className="flex flex-col gap-3">
                <InfoRow icon={<CreditCard size={14} className="text-amber-500" />} label="Plan" value={planLabel} />
                <InfoRow
                    icon={<Calendar size={14} className="text-amber-500" />}
                    label="Vence"
                    value={data.plan === "lifetime" ? "Indefinida" : (expiresLabel ?? "—")}
                />
                {data.days_remaining !== null && data.plan !== "lifetime" && (
                    <InfoRow
                        icon={<Clock size={14} className="text-amber-500" />}
                        label="Días restantes"
                        value={
                            data.days_remaining >= 0
                                ? `${data.days_remaining} día${data.days_remaining !== 1 ? "s" : ""}`
                                : `Venció hace ${Math.abs(data.days_remaining)}d`
                        }
                    />
                )}
            </div>

            {showLink && (
                <Link
                    to={AdminRoutes.Subscription}
                    className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-sm font-medium transition-colors"
                >
                    <span>Ver detalles y renovar</span>
                    <ChevronRight size={15} />
                </Link>
            )}
        </div>
    );
};

const STATUS_CONFIG: Record<SubscriptionStatusEnum, { label: string; color: string; icon: React.ReactNode }> = {
    [SubscriptionStatusEnum.Active]:  { label: "Activa",          color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle size={12} /> },
    [SubscriptionStatusEnum.Grace]:   { label: "Gracia",          color: "bg-amber-100 text-amber-700",     icon: <AlertTriangle size={12} /> },
    [SubscriptionStatusEnum.Expired]: { label: "Vencida",         color: "bg-red-100 text-red-700",         icon: <XCircle size={12} /> },
    [SubscriptionStatusEnum.Pending]: { label: "Sin suscripción", color: "bg-slate-100 text-slate-500",     icon: <Clock size={12} /> },
};

const StatusBadge = ({ status }: { status: SubscriptionStatusEnum }) => {
    const cfg = STATUS_CONFIG[status];
    return (
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
            {cfg.icon}
            {cfg.label}
        </span>
    );
};

interface InfoRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

const InfoRow = ({ icon, label, value }: InfoRowProps) => (
    <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-stone-400">
            {icon}
            <span>{label}</span>
        </div>
        <span className="font-medium text-stone-700">{value}</span>
    </div>
);
