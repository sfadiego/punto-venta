import { IMenuCategory } from "@/models/IMenu";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

interface CategoryFilterProps {
    categories: IMenuCategory[];
    activeId: number | null;
    onSelect: (id: number | null) => void;
    primaryColor: string;
}

export const CategoryFilter = ({ categories, activeId, onSelect, primaryColor }: CategoryFilterProps) => (
    <div className="shrink-0 bg-white border-b border-stone-100">
        <div className="max-w-3xl mx-auto px-4">
            <div
                className="flex gap-2 overflow-x-auto py-3"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
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
                        icon={c.icon}
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
    icon?: string | null;
    active: boolean;
    onClick: () => void;
    primaryColor: string;
}

const Pill = ({ label, icon, active, onClick, primaryColor }: PillProps) => (
    <button
        onClick={onClick}
        className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap min-h-[36px]"
        style={
            active
                ? { backgroundColor: primaryColor, color: "#fff" }
                : { backgroundColor: "#f5f5f4", color: "#57534e" }
        }
    >
        {icon && <DynamicIcon name={icon} size={15} />}
        {label}
    </button>
);
