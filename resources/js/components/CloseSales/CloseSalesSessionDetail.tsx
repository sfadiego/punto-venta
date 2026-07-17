import { CalendarClock, User, MessageSquare } from "lucide-react";
import { IMainOrderReport } from "@/models/IMainOrderReport";

interface CloseSalesSessionDetailProps {
    activeSale: IMainOrderReport;
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

interface DetailRowProps {
    icon: React.ReactNode;
    label: string;
    children: React.ReactNode;
}

const DetailRow = ({ icon, label, children }: DetailRowProps) => (
    <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-stone-100 mt-0.5 shrink-0">
            {icon}
        </div>
        <div>
            <p className="text-xs text-stone-500 font-medium mb-0.5">{label}</p>
            {children}
        </div>
    </div>
);

export const CloseSalesSessionDetail = ({ activeSale }: CloseSalesSessionDetailProps) => (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 mb-6 space-y-5">
        <DetailRow
            icon={<CalendarClock size={16} className="text-stone-600" />}
            label="Apertura de caja"
        >
            <p className="text-sm text-stone-800 font-medium capitalize">
                {formatDate(activeSale.created_at)}
            </p>
        </DetailRow>

        <DetailRow
            icon={<User size={16} className="text-stone-600" />}
            label="Abierta por"
        >
            <p className="text-sm text-stone-800 font-medium">
                {activeSale.user
                    ? `${activeSale.user.nombre} ${activeSale.user.apellido_paterno}`
                    : `Usuario #${activeSale.user_id}`}
            </p>
        </DetailRow>

        <DetailRow
            icon={<MessageSquare size={16} className="text-stone-600" />}
            label="Observaciones"
        >
            <p className="text-sm text-stone-800">
                {activeSale.observaciones?.trim() || (
                    <span className="text-stone-400 italic">Sin observaciones</span>
                )}
            </p>
        </DetailRow>
    </div>
);
