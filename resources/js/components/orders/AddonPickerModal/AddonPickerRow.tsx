import { Plus } from "lucide-react";
import { IAddon } from "@/models/IAddon";
import { UnitControls } from "@/components/ui/UnitControls";
import { formatAddonPrice } from "@/utils/addonUtils";
import { MAX_ADDON_QUANTITY } from "./useAddonPickerModal";

interface AddonPickerRowProps {
    addon: IAddon;
    quantity: number;
    onAdd: (addonId: number) => void;
    onRemove: (addonId: number) => void;
}

export const AddonPickerRow = ({ addon, quantity, onAdd, onRemove }: AddonPickerRowProps) => (
    <div className="w-full flex items-center gap-3 px-3 py-3">
        <span className="flex-1 min-w-0 text-sm font-medium text-stone-800 break-words">{addon.name}</span>
        <span className="text-sm font-bold tabular-nums shrink-0 text-[var(--color-primary)]">
            {formatAddonPrice(addon.price)}
        </span>
        {quantity === 0 ? (
            <button
                type="button"
                onClick={() => onAdd(addon.id)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white bg-[var(--color-primary)] transition-opacity active:opacity-70 shrink-0"
                aria-label={`Agregar ${addon.name}`}
            >
                <Plus size={14} />
            </button>
        ) : (
            <UnitControls
                quantity={quantity}
                primaryColor="var(--color-primary)"
                onAdd={() => onAdd(addon.id)}
                onRemove={() => onRemove(addon.id)}
                disableAdd={quantity >= MAX_ADDON_QUANTITY}
            />
        )}
    </div>
);
