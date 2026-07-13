import { Activity, RefreshCw } from "lucide-react";

interface ActiveUsersBadgeProps {
    count: number;
}

export const ActiveUsersBadge = ({ count }: ActiveUsersBadgeProps) => {
    if (count === 0) return null;

    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {count} activo{count !== 1 ? "s" : ""}
        </span>
    );
};

interface ActiveUsersDetailProps {
    count: number;
    maxUsers?: number;
    onRefresh: () => void;
    isRefreshing: boolean;
}

export const ActiveUsersDetail = ({ count, maxUsers, onRefresh, isRefreshing }: ActiveUsersDetailProps) => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${count > 0 ? "bg-emerald-100" : "bg-slate-100"}`}>
            <Activity size={15} className={count > 0 ? "text-emerald-600" : "text-slate-400"} />
        </div>
        <div className="flex-1">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Usuarios activos</p>
            <p className="text-sm font-semibold text-slate-800">
                {count}{maxUsers && maxUsers < 999999 ? ` / ${maxUsers}` : ""}
                <span className="font-normal text-slate-400 ml-1">últimos 15 min</span>
            </p>
        </div>
        {count > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
        <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Actualizar"
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-white text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
        >
            <RefreshCw size={13} className={isRefreshing ? "animate-spin" : ""} />
        </button>
    </div>
);
