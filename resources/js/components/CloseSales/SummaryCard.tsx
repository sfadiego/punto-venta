import React from "react";

interface SummaryCardProps {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string;
    valueColor?: string;
    note?: string;
    noteColor?: string;
    className?: string;
}

export const SummaryCard = ({
    icon,
    iconBg,
    label,
    value,
    valueColor = "text-stone-900",
    note,
    noteColor = "text-stone-400",
    className = "",
}: SummaryCardProps) => (
    <div className={`bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-4 shadow-sm ${className}`}>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
            {icon}
        </div>
        <div className="min-w-0">
            <p className="text-xs text-stone-500 font-medium">{label}</p>
            <p className={`text-xl font-bold mt-0.5 ${valueColor}`}>{value}</p>
            {note && <p className={`text-xs mt-1 ${noteColor}`}>{note}</p>}
        </div>
    </div>
);
