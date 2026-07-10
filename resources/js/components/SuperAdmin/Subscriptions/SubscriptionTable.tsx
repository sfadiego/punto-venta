import { DataTable } from "mantine-datatable";
import type { DataTableColumn } from "mantine-datatable";
import { Building2, CreditCard, Clock, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { ITenantWithSubscription } from "@/models/ISubscription";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";
import { PLAN_LABELS } from "@/enums/SubscriptionPlanEnum";

const STATUS_CONFIG: Record<SubscriptionStatusEnum, { label: string; color: string; icon: React.ReactNode }> = {
    [SubscriptionStatusEnum.Active]:  { label: "Activo",          color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle size={13} /> },
    [SubscriptionStatusEnum.Grace]:   { label: "Gracia",          color: "bg-amber-100 text-amber-700",     icon: <Clock size={13} /> },
    [SubscriptionStatusEnum.Expired]: { label: "Vencido",         color: "bg-red-100 text-red-700",         icon: <XCircle size={13} /> },
    [SubscriptionStatusEnum.Pending]: { label: "Sin suscripción", color: "bg-slate-100 text-slate-500",     icon: <MinusCircle size={13} /> },
};

interface SubscriptionTableProps {
    records: ITenantWithSubscription[];
    isLoading: boolean;
    onRegisterPayment: (tenant: ITenantWithSubscription) => void;
}

export const SubscriptionTable = ({ records, isLoading, onRegisterPayment }: SubscriptionTableProps) => {
    const columns: DataTableColumn<ITenantWithSubscription>[] = [
        {
            accessor: "business_name",
            title: "Cliente",
            render: (row) => (
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: row.primary_color }}
                    >
                        <Building2 size={14} className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-800">{row.business_name}</p>
                        <p className="text-xs text-slate-400 font-mono">/{row.slug}</p>
                    </div>
                </div>
            ),
        },
        {
            accessor: "subscription_status",
            title: "Estado",
            render: (row) => {
                const cfg = STATUS_CONFIG[row.subscription_status];
                return (
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                        {cfg.icon}
                        {cfg.label}
                    </span>
                );
            },
        },
        {
            accessor: "subscription_plan",
            title: "Plan",
            render: (row) =>
                row.subscription_plan
                    ? <span className="text-sm text-slate-600">{PLAN_LABELS[row.subscription_plan]}</span>
                    : <span className="text-slate-300">—</span>,
        },
        {
            accessor: "subscription_expires_at",
            title: "Vence",
            render: (row) => {
                if (!row.subscription_expires_at) return <span className="text-slate-300">—</span>;
                if (row.subscription_plan === "lifetime") {
                    return (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            ∞ Indefinida
                        </span>
                    );
                }
                const days = row.days_remaining ?? 0;
                const label = days >= 0 ? `${days}d restantes` : `Hace ${Math.abs(days)}d`;
                const color = days > 7 ? "text-slate-400" : days >= 0 ? "text-amber-600" : "text-red-500";
                return (
                    <div>
                        <p className="text-sm text-slate-700">
                            {new Date(row.subscription_expires_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                        <p className={`text-xs ${color}`}>{label}</p>
                    </div>
                );
            },
        },
        {
            accessor: "_acciones",
            title: "",
            render: (row) => (
                <button
                    onClick={() => onRegisterPayment(row)}
                    className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors whitespace-nowrap"
                >
                    <CreditCard size={13} />
                    Registrar pago
                </button>
            ),
        },
    ];

    return (
        <DataTable
            records={records}
            columns={columns}
            fetching={isLoading}
            minHeight={200}
            noRecordsText="No hay clientes"
            highlightOnHover
            withTableBorder
            borderRadius="md"
            styles={{ header: { background: "#f8fafc" } }}
        />
    );
};
