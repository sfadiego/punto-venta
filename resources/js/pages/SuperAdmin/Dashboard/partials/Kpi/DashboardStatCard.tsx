interface DashboardStatCardProps {
    label: string;
    value: string | number;
    subtext?: string;
    icon: React.ReactNode;
    color: string;
}

export const DashboardStatCard = ({ label, value, subtext, icon, color }: DashboardStatCardProps) => (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex flex-col gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
    </div>
);
