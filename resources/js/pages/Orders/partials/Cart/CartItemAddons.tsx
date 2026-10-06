import { ICartItem } from "@/models/ICartItem";
import { IAddonSelection } from "@/models/IAddon";
import { AddonPickerModal } from "@/components/orders/AddonPickerModal/AddonPickerModal";
import { formatMoney } from "@/utils/formatCurrency";
import { useCartItemAddons } from "./useCartItemAddons";

interface CartItemAddonsProps {
    item: ICartItem;
    isReadOnly: boolean;
    isPending: boolean;
    onEdit: (orderProductId: number, addons: IAddonSelection[]) => Promise<void>;
}

/** Toppings de una línea del carrito y el botón para cambiarlos con el mismo selector de la venta. */
export const CartItemAddons = ({ item, isReadOnly, isPending, onEdit }: CartItemAddonsProps) => {
    const addons = useCartItemAddons(item, onEdit);
    const showButton = addons.canEdit && !isReadOnly;

    if (item.addons.length === 0 && !showButton) return null;

    return (
        <>
            {item.addons.length > 0 && (
                <ul className="mt-0.5 space-y-0.5">
                    {item.addons.map((addon, index) => (
                        <li key={`${addon.addonId ?? "x"}-${index}`} className="text-xs text-stone-500 flex items-baseline gap-1.5">
                            <span className="truncate">
                                + {addon.name}
                                {addon.quantity > 1 && ` ×${addon.quantity}`}
                            </span>
                            {addon.price > 0 && (
                                <span className="tabular-nums text-stone-400">${formatMoney(addon.price * addon.quantity)}</span>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            {showButton && (
                <button
                    type="button"
                    onClick={addons.openModal}
                    disabled={isPending || addons.isLocked}
                    title={addons.isLocked ? "Ya se preparó; agrega una línea nueva para otros toppings" : undefined}
                    className="mt-0.5 text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:text-stone-300 disabled:cursor-not-allowed transition-colors"
                >
                    {item.addons.length > 0 ? "Editar toppings" : "+ Toppings"}
                </button>
            )}

            <AddonPickerModal
                isOpen={addons.isOpen}
                mode="edit"
                title={addons.title}
                basePrice={item.price}
                addons={item.availableAddons}
                initialSelection={addons.initialSelection}
                notice={addons.notice}
                onConfirm={addons.handleConfirm}
                onClose={addons.closeModal}
            />
        </>
    );
};
