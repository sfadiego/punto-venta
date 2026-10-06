import { Loader, Pencil, Trash2 } from "lucide-react";
import { IAddon } from "@/models/IAddon";
import { formatAddonPrice } from "@/utils/addonUtils";

interface AddonListItemProps {
    addon: IAddon;
    isSelected: boolean;
    isDeleting: boolean;
    onSelect: (id: number) => void;
    onEdit: (addon: IAddon) => void;
    onDelete: (addon: IAddon) => void;
}

export const AddonListItem = ({ addon, isSelected, isDeleting, onSelect, onEdit, onDelete }: AddonListItemProps) => {
    const count = addon.products_count ?? 0;

    return (
        <div
            className={`shrink-0 flex items-center gap-1 rounded-xl pr-1 transition-colors ${
                isSelected ? "bg-amber-50" : "hover:bg-stone-50"
            } ${addon.is_active ? "" : "opacity-60"}`}
        >
            <button
                type="button"
                onClick={() => onSelect(addon.id)}
                aria-pressed={isSelected}
                className="flex-1 min-w-0 text-left px-3 py-2"
            >
                <span className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-medium text-stone-800 break-words min-w-0">{addon.name}</span>
                    <span className="font-mono text-xs text-stone-500 whitespace-nowrap">{formatAddonPrice(addon.price)}</span>
                </span>
                <span className="block text-xs text-stone-400 mt-0.5">
                    {count} {count === 1 ? "producto" : "productos"}
                    {!addon.is_active && " · Inactivo"}
                </span>
            </button>
            <button
                type="button"
                onClick={() => onEdit(addon)}
                aria-label={`Editar ${addon.name}`}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
            >
                <Pencil size={14} />
            </button>
            <button
                type="button"
                onClick={() => onDelete(addon)}
                disabled={isDeleting}
                aria-label={`Eliminar ${addon.name}`}
                className="p-1.5 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
            >
                {isDeleting ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
        </div>
    );
};
