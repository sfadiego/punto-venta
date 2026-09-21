import { IDashboardFeatureAdoption, IDashboardTenantCounts } from "@/models/IDashboard";

interface FeatureAdoptionCardProps {
    adoption: IDashboardFeatureAdoption;
    tenants: IDashboardTenantCounts;
}

export const FeatureAdoptionCard = ({ adoption, tenants }: FeatureAdoptionCardProps) => {
    // Base = tenants activos (mismo universo que DashboardService::featureAdoption()) — evita
    // dividir entre cero si aún no hay tenants activos.
    const base = tenants.active || 1;
    const rows: { label: string; value: number }[] = [
        { label: "Multi-sucursal", value: adoption.multi_branch },
        { label: "Impresión", value: adoption.printer },
        { label: "Control de stock", value: adoption.stock },
        { label: "Clientes a crédito", value: adoption.customers },
    ];

    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-3">Adopción de features (tenants activos)</h2>
            <div className="flex flex-col gap-3">
                {rows.map((row) => (
                    <div key={row.label} className="flex items-center gap-3">
                        <div className="w-32 text-xs font-medium text-slate-500 shrink-0">{row.label}</div>
                        <div className="flex-grow h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{ width: `${Math.min(100, (row.value / base) * 100)}%` }}
                            />
                        </div>
                        <div className="w-8 text-right text-xs font-semibold text-slate-700">{row.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};
