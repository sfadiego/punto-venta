import { CreditCard, CheckCircle, XCircle, Clock, MinusCircle } from "lucide-react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { SubscriptionTable } from "@/components/SuperAdmin/Subscriptions/SubscriptionTable";
import { RegisterPaymentModal } from "@/components/SuperAdmin/Subscriptions/RegisterPaymentModal";
import { PaymentHistoryModal } from "@/components/SuperAdmin/Subscriptions/PaymentHistoryModal";
import { useSubscriptionsPage } from "./useSubscriptionsPage";
import { SubscriptionStatusEnum } from "@/enums/SubscriptionStatusEnum";

const FILTERS = [
    { label: "Todos",           value: "" },
    { label: "Activos",         value: SubscriptionStatusEnum.Active },
    { label: "Vencidos",        value: SubscriptionStatusEnum.Expired },
    { label: "Período de gracia", value: SubscriptionStatusEnum.Grace },
    { label: "Sin suscripción", value: SubscriptionStatusEnum.Pending },
];

export default function SubscriptionsPage() {
    const {
        filtered,
        isLoading,
        statusFilter,
        setStatusFilter,
        selectedTenant,
        openModal,
        closeModal,
        historyTenant,
        openHistory,
        closeHistory,
        summary,
    } = useSubscriptionsPage();

    return (
        <SuperAdminLayout>
            <div className="px-6 py-6 max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900">Suscripciones</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Control de pagos y vigencias de clientes</p>
                </div>

                {/* Tarjetas resumen */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    <SummaryCard
                        label="Activos"
                        value={summary.active}
                        icon={<CheckCircle size={18} />}
                        color="text-emerald-600 bg-emerald-50"
                    />
                    <SummaryCard
                        label="Vencidos"
                        value={summary.expired}
                        icon={<XCircle size={18} />}
                        color="text-red-500 bg-red-50"
                    />
                    <SummaryCard
                        label="Período de gracia"
                        value={summary.grace}
                        icon={<Clock size={18} />}
                        color="text-amber-600 bg-amber-50"
                    />
                    <SummaryCard
                        label="Sin suscripción"
                        value={summary.pending}
                        icon={<MinusCircle size={18} />}
                        color="text-slate-400 bg-slate-100"
                    />
                </div>

                {/* Filtro */}
                <div className="flex items-center gap-3 mb-4">
                    <CreditCard size={16} className="text-slate-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as SubscriptionStatusEnum | "")}
                        className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                    >
                        {FILTERS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                    </select>
                    <span className="text-xs text-slate-400">{filtered.length} cliente{filtered.length !== 1 ? "s" : ""}</span>
                </div>

                <SubscriptionTable
                    records={filtered}
                    isLoading={isLoading}
                    onRegisterPayment={openModal}
                    onViewHistory={openHistory}
                />
            </div>

            <RegisterPaymentModal tenant={selectedTenant} onClose={closeModal} />
            <PaymentHistoryModal tenant={historyTenant} onClose={closeHistory} />
        </SuperAdminLayout>
    );
}

interface SummaryCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}

const SummaryCard = ({ label, value, icon, color }: SummaryCardProps) => (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3.5 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-xl font-bold text-slate-800 leading-tight">{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
        </div>
    </div>
);
