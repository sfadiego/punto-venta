import { IDashboardClientLeads } from "@/models/IDashboard";

interface ClientLeadsSummaryCardProps {
    leads: IDashboardClientLeads;
}

export const ClientLeadsSummaryCard = ({ leads }: ClientLeadsSummaryCardProps) => (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-slate-900 mb-3">Solicitudes de demo</h2>
        <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
                <p className="text-xl font-bold text-amber-600">{leads.follow_up}</p>
                <p className="text-xs text-slate-500 font-medium">En seguimiento</p>
            </div>
            <div className="flex flex-col gap-1">
                <p className="text-xl font-bold text-emerald-600">{leads.customer}</p>
                <p className="text-xs text-slate-500 font-medium">Convertidos</p>
            </div>
            <div className="flex flex-col gap-1">
                <p className="text-xl font-bold text-slate-400">{leads.discarded}</p>
                <p className="text-xs text-slate-500 font-medium">Descartados</p>
            </div>
        </div>
    </div>
);
