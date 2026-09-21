import { Loader } from "lucide-react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { useDashboardPage } from "./useDashboardPage";
import { KpiRow } from "./partials/Kpi/KpiRow";
import { ExpiringSubscriptionsCard } from "./partials/ExpiringSubscriptionsCard";
import { StaleTenantsCard } from "./partials/StaleTenantsCard";
import { RecentErrorsCard } from "./partials/RecentErrorsCard";
import { ClientLeadsSummaryCard } from "./partials/ClientLeadsSummaryCard";
import { FeatureAdoptionCard } from "./partials/FeatureAdoptionCard";

export default function DashboardPage() {
    const { summary, isLoading } = useDashboardPage();

    return (
        <SuperAdminLayout>
            <div className="px-6 py-6 max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Vista general de todos los tenants</p>
                </div>

                {isLoading || !summary ? (
                    <div className="flex items-center justify-center py-20 text-slate-400">
                        <Loader size={24} className="animate-spin" />
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <KpiRow
                            tenants={summary.tenants}
                            activeUsersNow={summary.active_users_now}
                            mrr={summary.mrr}
                            errors={summary.errors_last_24h}
                        />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                            <ExpiringSubscriptionsCard subscriptions={summary.expiring_subscriptions} />
                            <StaleTenantsCard tenants={summary.stale_tenants} />
                        </div>

                        <RecentErrorsCard errors={summary.recent_errors} />

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <ClientLeadsSummaryCard leads={summary.client_leads} />
                            <FeatureAdoptionCard adoption={summary.feature_adoption} tenants={summary.tenants} />
                        </div>
                    </div>
                )}
            </div>
        </SuperAdminLayout>
    );
}
