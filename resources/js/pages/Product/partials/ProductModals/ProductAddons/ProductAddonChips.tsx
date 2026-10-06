import { X } from "lucide-react";
import { IAddon } from "@/models/IAddon";
import { formatAddonPrice } from "@/utils/addonUtils";
import { MAX_VISIBLE_ADDON_CHIPS } from "./useProductAddonsField";

interface ProductAddonChipsProps {
    selected: IAddon[];
    expanded: boolean;
    onToggleExpanded: () => void;
    onRemove: (id: number) => void;
}

export const ProductAddonChips = ({ selected, expanded, onToggleExpanded, onRemove }: ProductAddonChipsProps) => {
    if (selected.length === 0) return null;

    const visible = expanded ? selected : selected.slice(0, MAX_VISIBLE_ADDON_CHIPS);
    const hiddenCount = selected.length - MAX_VISIBLE_ADDON_CHIPS;

    // Fragmento: los chips comparten la caja con borde del campo (ver ProductAddonsField).
    return (
        <>
            {visible.map((addon) => (
                <span
                    key={addon.id}
                    className={`inline-flex items-center gap-1.5 bg-amber-50 text-stone-800 rounded-full pl-3 pr-1 py-0.5 text-xs max-w-full ${
                        addon.is_active ? "" : "opacity-60"
                    }`}
                >
                    <span className="truncate">{addon.name}</span>
                    {addon.price > 0 && (
                        <span className="font-mono text-[11px] text-stone-500">{formatAddonPrice(addon.price)}</span>
                    )}
                    {!addon.is_active && <span className="text-stone-500">(inactivo)</span>}
                    <button
                        type="button"
                        onClick={() => onRemove(addon.id)}
                        aria-label={`Quitar ${addon.name}`}
                        className="w-5 h-5 rounded-full flex items-center justify-center text-stone-500 hover:bg-amber-100 hover:text-stone-800 transition-colors"
                    >
                        <X size={12} />
                    </button>
                </span>
            ))}
            {hiddenCount > 0 && (
                <button
                    type="button"
                    onClick={onToggleExpanded}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 px-2"
                >
                    {expanded ? "Ver menos" : `+${hiddenCount} más`}
                </button>
            )}
        </>
    );
};
