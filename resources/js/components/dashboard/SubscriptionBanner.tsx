import { AlertTriangle, XCircle, Clock, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";
import { SubscriptionPlanEnum } from "@/enums/SubscriptionPlanEnum";

interface SubscriptionStatusResponse {
    status: SubscriptionStatusEnum;
    plan: SubscriptionPlanEnum | null;
    days_remaining: number | null;
    expires_at: string | null;
    payment_whatsapp: string | null;
}

const WARN_DAYS = 7;

export const SubscriptionBanner = () => {
    const { data } = useGET<SubscriptionStatusResponse>({
        url: `${ApiRoutes.BusinessConfig}/subscription-status`,
        nameQuery: "subscription-detail",
    });

    if (!data) return null;

    const { status, days_remaining } = data;

    if (status === SubscriptionStatusEnum.Active && (days_remaining === null || days_remaining > WARN_DAYS)) {
        return null;
    }

    if (status === SubscriptionStatusEnum.Expired) {
        return (
            <Banner
                icon={<XCircle size={15} />}
                color="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                message="Tu suscripción ha vencido."
            />
        );
    }

    if (status === SubscriptionStatusEnum.Grace) {
        return (
            <Banner
                icon={<AlertTriangle size={15} />}
                color="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                message="Período de gracia activo — tu suscripción venció hace poco."
            />
        );
    }

    if (status === SubscriptionStatusEnum.Pending) {
        return (
            <Banner
                icon={<Clock size={15} />}
                color="bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                message="No tienes una suscripción activa."
            />
        );
    }

    if (status === SubscriptionStatusEnum.Active && days_remaining !== null && days_remaining <= WARN_DAYS) {
        return (
            <Banner
                icon={<Clock size={15} />}
                color="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                message={`Tu suscripción vence en ${days_remaining} día${days_remaining !== 1 ? "s" : ""}.`}
            />
        );
    }

    return null;
};

interface BannerProps {
    icon: React.ReactNode;
    color: string;
    message: string;
}

const Banner = ({ icon, color, message }: BannerProps) => (
    <Link
        to={AdminRoutes.Subscription}
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm mb-4 transition-colors ${color}`}
    >
        <span className="shrink-0">{icon}</span>
        <p className="flex-1">{message}</p>
        <span className="shrink-0 flex items-center gap-1 text-xs font-medium opacity-70">
            Ver detalles
            <ChevronRight size={13} />
        </span>
    </Link>
);
