import { useEffect, useRef } from "react";
import { Loader, Plus } from "lucide-react";
import { IAddon } from "@/models/IAddon";
import { formatAddonPrice } from "@/utils/addonUtils";

interface ProductAddonOptionsProps {
    addons: IAddon[];
    selectedIds: string[];
    activeIndex: number;
    isLoading: boolean;
    isCreating: boolean;
    showCreate: boolean;
    query: string;
    catalogSize: number;
    onToggle: (id: number) => void;
    onCreate: () => void;
}

// Se renderiza en flujo normal (empuja el contenido) en vez de flotar: el formulario de
// producto tiene overflow-y-auto y un desplegable absoluto quedaría recortado — mismo
// criterio que la prop `inline` de ProductAutocomplete.
export const ProductAddonOptions = ({
    addons,
    selectedIds,
    activeIndex,
    isLoading,
    isCreating,
    showCreate,
    query,
    catalogSize,
    onToggle,
    onCreate,
}: ProductAddonOptionsProps) => {
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        const active = listRef.current?.children[activeIndex] as HTMLElement | undefined;
        active?.scrollIntoView({ block: "nearest" });
    }, [activeIndex]);

    const isEmpty = addons.length === 0 && !showCreate;

    return (
        <ul
            ref={listRef}
            role="listbox"
            aria-multiselectable="true"
            className="mt-1 bg-white border border-stone-200 rounded-xl shadow-lg p-1 max-h-52 overflow-y-auto"
        >
            {isLoading && (
                <li className="flex items-center justify-center gap-2 px-3 py-2.5 text-xs text-stone-400">
                    <Loader size={14} className="animate-spin" />
                    Cargando toppings...
                </li>
            )}

            {addons.map((addon, index) => {
                const checked = selectedIds.includes(String(addon.id));
                return (
                    <li
                        key={addon.id}
                        role="option"
                        aria-selected={checked}
                        onClick={() => onToggle(addon.id)}
                        className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm cursor-pointer hover:bg-stone-50 ${
                            index === activeIndex ? "bg-stone-100" : ""
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            tabIndex={-1}
                            className="w-4 h-4 rounded border-stone-300 text-amber-500 pointer-events-none"
                        />
                        <span className="flex-1 min-w-0 text-stone-800 break-words">{addon.name}</span>
                        <span className="text-xs text-stone-500 whitespace-nowrap">{formatAddonPrice(addon.price)}</span>
                    </li>
                );
            })}

            {showCreate && (
                <li
                    role="option"
                    aria-selected={false}
                    onClick={onCreate}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-semibold text-amber-600 cursor-pointer hover:bg-stone-50 ${
                        activeIndex === addons.length ? "bg-stone-100" : ""
                    }`}
                >
                    {isCreating ? <Loader size={14} className="animate-spin" /> : <Plus size={14} />}
                    <span className="break-words">Crear "{query.trim()}" y asignar</span>
                </li>
            )}

            {!isLoading && isEmpty && (
                <li className="px-3 py-2.5 text-xs text-stone-400 text-center">
                    {catalogSize === 0 && query.trim() === ""
                        ? "Aún no hay toppings en el catálogo."
                        : "Ningún topping coincide."}
                </li>
            )}
        </ul>
    );
};
