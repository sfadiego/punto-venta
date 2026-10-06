import { IOrderProductAddon } from "@/models/IOrderProductAddon";

interface ProductAddonsBadgesProps {
    addons: IOrderProductAddon[];
    isReady: boolean;
}

/** Toppings de un platillo, bien visibles para quien lo prepara en cocina. */
export const ProductAddonsBadges = ({ addons, isReady }: ProductAddonsBadgesProps) => {
    if (addons.length === 0) return null;

    return (
        <ul className="flex flex-wrap gap-1 mt-1.5" aria-label="Toppings">
            {addons.map((addon) => (
                <li
                    key={addon.id}
                    className={`text-xs font-semibold rounded-full px-2 py-0.5 ${
                        isReady ? "bg-emerald-100 text-emerald-700 line-through decoration-emerald-400/60" : "bg-amber-100 text-amber-800"
                    }`}
                >
                    + {addon.name}
                    {addon.quantity > 1 && ` ×${addon.quantity}`}
                </li>
            ))}
        </ul>
    );
};
