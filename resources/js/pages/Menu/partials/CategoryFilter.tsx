import { IMenuCategory } from "@/services/useMenuService";

interface CategoryFilterProps {
    categories: IMenuCategory[];
    activeId: number | null;
    onSelect: (id: number | null) => void;
    primaryColor: string;
}

export const CategoryFilter = ({ categories, activeId, onSelect, primaryColor }: CategoryFilterProps) => (
    <div className="shrink-0 bg-white border-b border-stone-100">
        <div
            className="max-w-3xl mx-auto px-4"
            style={{ WebkitOverflowScrolling: "touch" } as React.CSSProperties}
        >
            <div
                className="flex gap-2 overflow-x-auto py-3"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
                <Pill
                    label="Todos"
                    active={activeId === null}
                    onClick={() => onSelect(null)}
                    primaryColor={primaryColor}
                />
                {categories.map((c) => (
                    <Pill
                        key={c.id}
                        label={c.nombre}
                        active={activeId === c.id}
                        onClick={() => onSelect(activeId === c.id ? null : c.id)}
                        primaryColor={primaryColor}
                    />
                ))}
            </div>
        </div>
    </div>
);

interface PillProps {
    label: string;
    active: boolean;
    onClick: () => void;
    primaryColor: string;
}

const Pill = ({ label, active, onClick, primaryColor }: PillProps) => (
    <button
        onClick={onClick}
        className="shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap min-h-[36px]"
        style={
            active
                ? { backgroundColor: primaryColor, color: "#fff" }
                : { backgroundColor: "#f5f5f4", color: "#57534e" }
        }
    >
        {label}
    </button>
);
