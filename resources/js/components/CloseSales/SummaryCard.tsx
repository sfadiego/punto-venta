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
    action?: React.ReactNode;
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
    action,
}: SummaryCardProps) => (
    <div className={`bg-white rounded-2xl border border-stone-100 p-5 flex items-start gap-4 shadow-sm ${className}`}>
        <div className={`p-2.5 rounded-xl shrink-0 ${iconBg}`}>
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs text-stone-500 font-medium">{label}</p>
                {action}
            </div>
            <p className={`text-xl font-bold mt-0.5 ${valueColor}`}>{value}</p>
            {note && <p className={`text-xs mt-1 ${noteColor}`}>{note}</p>}
        </div>
    </div>
);
