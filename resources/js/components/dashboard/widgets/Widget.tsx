import React from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

interface IWidgetProps {
    title: string;
    value: string;
    wicon: React.ComponentType<{ size?: number; className?: string }>;
    trend: string;
    up: boolean;
    iconBg: string;
    iconColor: string;
}

export const Widget = ({ title, value, wicon: Icon, trend, up, iconBg, iconColor }: IWidgetProps) => {
    return (
        <div className="bg-white rounded-xl border border-stone-100 p-3.5 sm:p-5 shadow-sm min-w-0">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    <Icon size={16} className={`sm:hidden ${iconColor}`} />
                    <Icon size={18} className={`hidden sm:block ${iconColor}`} />
                </div>
                {up ? (
                    <TrendingUp size={14} className="text-emerald-500 mt-1 flex-shrink-0" />
                ) : (
                    <TrendingDown size={14} className="text-red-400 mt-1 flex-shrink-0" />
                )}
            </div>
            <p className="text-stone-500 text-xs font-medium leading-tight truncate">{title}</p>
            <p className="text-stone-900 text-lg sm:text-xl font-bold mt-1 truncate">{value}</p>
            <p className={`text-xs mt-1 truncate ${up ? "text-emerald-600" : "text-red-400"}`}>{trend}</p>
        </div>
    );
};
