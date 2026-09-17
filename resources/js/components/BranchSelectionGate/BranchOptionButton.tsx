import { Store } from "lucide-react";

interface BranchOptionButtonProps {
    name: string;
    address?: string | null;
    selected?: boolean;
    onClick: () => void;
}

export const BranchOptionButton = ({ name, address, selected, onClick }: BranchOptionButtonProps) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors text-left ${
            selected ? "border-amber-400 bg-amber-50" : "border-stone-200 bg-white hover:border-amber-400 hover:bg-amber-50"
        }`}
    >
        <div className="w-9 h-9 rounded-lg bg-stone-50 flex items-center justify-center shrink-0">
            <Store size={16} className="text-stone-500" />
        </div>
        <div className="min-w-0">
            <p className="text-sm font-medium text-stone-800 truncate">{name}</p>
            {address && <p className="text-xs text-stone-400 truncate">{address}</p>}
        </div>
    </button>
);
