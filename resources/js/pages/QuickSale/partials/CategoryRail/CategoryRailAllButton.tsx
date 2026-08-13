import { LayoutGrid } from "lucide-react";

interface CategoryRailAllButtonProps {
    isActive: boolean;
    onSelect: () => void;
}

export const CategoryRailAllButton = ({ isActive, onSelect }: CategoryRailAllButtonProps) => (
    <button
        type="button"
        onClick={onSelect}
        className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-center transition-colors ${
            isActive ? "text-white shadow-sm" : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
        }`}
        style={isActive ? { backgroundColor: "var(--color-primary)" } : undefined}
    >
        <LayoutGrid size={20} />
        <span className="text-[11px] font-semibold leading-tight">TODOS</span>
    </button>
);
