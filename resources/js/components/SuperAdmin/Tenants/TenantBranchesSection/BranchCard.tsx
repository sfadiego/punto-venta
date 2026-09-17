import { Pencil, Store } from "lucide-react";
import { IBranch } from "@/models/IBranch";

interface BranchCardProps {
    branch: IBranch;
    onToggleActive: () => void;
    onEdit: () => void;
}

export const BranchCard = ({ branch, onToggleActive, onEdit }: BranchCardProps) => (
    <div className="border border-slate-100 rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
            <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                <Store size={16} className="text-slate-500" />
            </div>
            <button
                type="button"
                onClick={onToggleActive}
                title={branch.active ? "Desactivar sucursal" : "Activar sucursal"}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 transition-colors ${
                    branch.active
                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
            >
                <span className={`w-1.5 h-1.5 rounded-full ${branch.active ? "bg-emerald-500" : "bg-slate-400"}`} />
                {branch.active ? "Activa" : "Inactiva"}
            </button>
        </div>
        <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{branch.name}</p>
                {branch.address && (
                    <p className="text-xs text-slate-400 truncate mt-0.5">{branch.address}</p>
                )}
            </div>
            <button
                type="button"
                onClick={onEdit}
                title="Editar sucursal"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
                <Pencil size={14} />
            </button>
        </div>
    </div>
);
