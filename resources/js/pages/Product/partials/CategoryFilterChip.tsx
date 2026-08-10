interface CategoryFilterChipProps {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

export const CategoryFilterChip = ({ active, onClick, children }: CategoryFilterChipProps) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            active
                ? "bg-amber-500 text-white shadow-sm shadow-amber-200"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
        }`}
    >
        {children}
    </button>
);
