import { Users, Sparkles, UserX, Activity, Wallet, AlertTriangle } from "lucide-react";
import { IDashboardErrorCounts, IDashboardTenantCounts } from "@/models/IDashboard";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { DashboardStatCard } from "./DashboardStatCard";

interface KpiRowProps {
    tenants: IDashboardTenantCounts;
    activeUsersNow: number;
    mrr: number;
    errors: IDashboardErrorCounts;
}

export const KpiRow = ({ tenants, activeUsersNow, mrr, errors }: KpiRowProps) => (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <DashboardStatCard
            label="Tenants activos"
            value={tenants.active}
            icon={<Users size={16} />}
            color="text-emerald-600 bg-emerald-50"
        />
        <DashboardStatCard
            label="Tenants demo"
            value={tenants.demo}
            icon={<Sparkles size={16} />}
            color="text-purple-600 bg-purple-50"
        />
        <DashboardStatCard
            label="Tenants inactivos"
            value={tenants.inactive}
            icon={<UserX size={16} />}
            color="text-red-600 bg-red-50"
        />
        <DashboardStatCard
            label="Usuarios activos ahora"
            value={activeUsersNow}
            subtext="últimos 15 min"
            icon={<Activity size={16} />}
            color="text-blue-600 bg-blue-50"
        />
        <DashboardStatCard
            label="MRR"
            value={formatCurrencyTrimmed(mrr)}
            icon={<Wallet size={16} />}
            color="text-amber-600 bg-amber-50"
        />
        <DashboardStatCard
            label="Errores (24h)"
            value={errors.total}
            subtext={`${errors.backend} backend · ${errors.frontend} frontend`}
            icon={<AlertTriangle size={16} />}
            color="text-red-600 bg-red-50"
        />
    </div>
);
