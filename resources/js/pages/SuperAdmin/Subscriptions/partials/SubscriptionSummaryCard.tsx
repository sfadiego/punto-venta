interface SubscriptionSummaryCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
}

export const SubscriptionSummaryCard = ({ label, value, icon, color }: SubscriptionSummaryCardProps) => (
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
