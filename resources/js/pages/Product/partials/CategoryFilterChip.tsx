import { Loader2 } from "lucide-react";

interface CategoryFilterChipProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    loading?: boolean;
}

export const CategoryFilterChip = ({ active, onClick, children, loading = false }: CategoryFilterChipProps) => (
    <button
        onClick={onClick}
        aria-busy={loading}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            active
                ? "bg-amber-500 text-white shadow-sm shadow-amber-200"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
        }`}
    >
        {loading && <Loader2 size={12} className="animate-spin" />}
        {children}
    </button>
);
