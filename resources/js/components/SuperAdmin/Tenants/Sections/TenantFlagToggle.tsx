import { ReactNode } from "react";

interface TenantFlagToggleProps {
    icon: ReactNode;
    title: string;
    description: string;
    checked: boolean;
    onToggle: () => void;
}

export const TenantFlagToggle = ({ icon, title, description, checked, onToggle }: TenantFlagToggleProps) => (
    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                {icon}
            </div>
            <div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
        </div>
        <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                checked ? "bg-indigo-600" : "bg-slate-200"
            }`}
            role="switch"
            aria-checked={checked}
            aria-label={title}
        >
            <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    checked ? "translate-x-5" : "translate-x-0"
                }`}
            />
        </button>
    </div>
);
