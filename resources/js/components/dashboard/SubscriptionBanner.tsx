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

interface BannerConfig {
    icon: React.ReactNode;
    color: string;
    message: string;
    shortMessage: string;
}

const WARN_DAYS = 7;

const STATUS_BANNER: Partial<Record<SubscriptionStatusEnum, BannerConfig>> = {
    [SubscriptionStatusEnum.Expired]: {
        icon:    <XCircle size={15} />,
        color:   "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
        message: "Tu suscripción ha vencido.",
        shortMessage: "Suscripción vencida",
    },
    [SubscriptionStatusEnum.Grace]: {
        icon:    <AlertTriangle size={15} />,
        color:   "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
        message: "Período de gracia activo — tu suscripción venció hace poco.",
        shortMessage: "En gracia",
    },
    [SubscriptionStatusEnum.Pending]: {
        icon:    <Clock size={15} />,
        color:   "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100",
        message: "No tienes una suscripción activa.",
        shortMessage: "Sin suscripción",
    },
};

const getActiveBannerConfig = (days: number | null): BannerConfig | null => {
    if (days === null || days > WARN_DAYS) return null;
    return {
        icon:    <Clock size={15} />,
        color:   "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
        message: `Tu suscripción vence en ${days} día${days !== 1 ? "s" : ""}.`,
        shortMessage: `Vence en ${days} día${days !== 1 ? "s" : ""}`,
    };
};

const resolveBanner = (status: SubscriptionStatusEnum, days: number | null): BannerConfig | null => {
    if (status === SubscriptionStatusEnum.Active) return getActiveBannerConfig(days);
    return STATUS_BANNER[status] ?? null;
};

interface SubscriptionBannerProps {
    /** Chip pequeño para barras de trabajo (QuickSale): solo ícono en móvil, sin "Ver detalles". */
    compact?: boolean;
}

export const SubscriptionBanner = ({ compact = false }: SubscriptionBannerProps) => {
    const { data } = useGET<SubscriptionStatusResponse>({
        url: `${ApiRoutes.BusinessConfig}/subscription-status`,
        nameQuery: "subscription-detail",
    });

    if (!data) return null;

    const config = resolveBanner(data.status, data.days_remaining);
    if (!config) return null;

    return compact ? <CompactBanner {...config} /> : <Banner {...config} />;
};

type BannerProps = BannerConfig;

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

const CompactBanner = ({ icon, color, shortMessage }: BannerProps) => (
    <Link
        to={AdminRoutes.Subscription}
        title={shortMessage}
        aria-label={shortMessage}
        className={`flex items-center gap-1.5 shrink-0 px-2.5 py-2 rounded-xl border text-xs font-medium whitespace-nowrap transition-colors ${color}`}
    >
        {icon}
        <span className="hidden sm:inline">{shortMessage}</span>
        <ChevronRight size={12} className="hidden sm:block opacity-70" />
    </Link>
);
