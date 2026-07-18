import { useRef } from "react";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { CategoryOption } from "./useProductGrid";

interface CategoryTabsProps {
    categories: CategoryOption[];
    activeCategory: string;
    onSelect: (name: string) => void;
}

export const CategoryTabs = ({ categories, activeCategory, onSelect }: CategoryTabsProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSelect = (name: string) => {
        onSelect(name);
        // Scroll el tab activo al centro
        const container = scrollRef.current;
        const activeBtn = container?.querySelector<HTMLButtonElement>(`[data-cat="${name}"]`);
        if (container && activeBtn) {
            const offset = activeBtn.offsetLeft - container.clientWidth / 2 + activeBtn.clientWidth / 2;
            container.scrollTo({ left: offset, behavior: "smooth" });
        }
    };

    return (
        <div
            ref={scrollRef}
            className="flex overflow-x-auto gap-1.5 p-1.5 rounded-2xl scrollbar-none"
            style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 8%, #f5f5f4)" }}
        >
            {categories.map((cat) => {
                const isActive = activeCategory === cat.name;
                return (
                    <button
                        key={cat.name}
                        data-cat={cat.name}
                        onClick={() => handleSelect(cat.name)}
                        className={`flex items-center gap-2 pl-2.5 pr-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-200 active:scale-95 ${
                            isActive
                                ? "shadow-sm text-white"
                                : "text-stone-500 hover:text-stone-700 hover:bg-white/60"
                        }`}
                        style={isActive ? { backgroundColor: "var(--color-primary)" } : undefined}
                    >
                        <span
                            className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isActive ? "bg-white/20" : "bg-white"
                            }`}
                        >
                            <DynamicIcon
                                name={cat.icon ?? "Tag"}
                                size={12}
                                className={isActive ? "text-white" : "text-stone-400"}
                            />
                        </span>
                        {cat.name}
                        {cat.count !== undefined && (
                            <span
                                className={`text-xs tabular-nums font-bold px-1.5 py-0.5 rounded-full ${
                                    isActive
                                        ? "bg-white/25 text-white"
                                        : "bg-stone-200 text-stone-500"
                                }`}
                            >
                                {cat.count}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
};
