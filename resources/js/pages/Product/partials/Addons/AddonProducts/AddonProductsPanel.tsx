import { Check, Loader, Search } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { formatAddonPrice } from "@/utils/addonUtils";
import { AddonProductCategoryGroup } from "./AddonProductCategoryGroup";
import { useAddonProductsPanel } from "./useAddonProductsPanel";

interface AddonProductsPanelProps {
    addonId: number;
}

/** Panel derecho del catálogo: productos agrupados por categoría donde se ofrece el topping. */
export const AddonProductsPanel = ({ addonId }: AddonProductsPanelProps) => {
    const panel = useAddonProductsPanel(addonId);

    if (panel.isLoading) {
        return (
            <div className="flex items-center justify-center gap-2 py-16 text-sm text-stone-400">
                <Loader size={16} className="animate-spin" />
                Cargando productos...
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="font-semibold text-stone-900 text-sm break-words">
                        {panel.addon?.name}{" "}
                        <span className="font-mono text-xs font-normal text-stone-500">
                            {formatAddonPrice(panel.addon?.price ?? 0)}
                        </span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                        Se ofrece en <span className="font-mono font-semibold">{panel.selectedCount} de {panel.totalProducts}</span> productos
                    </p>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-stone-500 whitespace-nowrap" aria-live="polite">
                    {panel.isSaving ? (
                        <>
                            <Loader size={12} className="animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Check size={12} className="text-emerald-600" />
                            Guardado
                        </>
                    )}
                </span>
            </div>

            <Input
                name="addon_product_search"
                icon={<Search size={14} />}
                placeholder="Buscar producto..."
                value={panel.search}
                onChange={(event) => panel.setSearch(event.target.value)}
                autoComplete="off"
            />

            <div className="flex flex-col gap-2.5 max-h-72 md:max-h-[46vh] overflow-y-auto pr-1">
                {panel.groups.length === 0 ? (
                    <p className="py-8 text-center text-sm text-stone-400">
                        {panel.search.trim() ? "Ningún producto coincide." : "Aún no hay productos."}
                    </p>
                ) : (
                    panel.groups.map((group) => (
                        <AddonProductCategoryGroup
                            key={group.categoryId}
                            group={group}
                            selectedIds={panel.selectedIds}
                            onToggleCategory={panel.toggleCategory}
                            onToggleProduct={panel.toggleProduct}
                        />
                    ))
                )}
            </div>

            <p className="text-xs text-stone-400">Los cambios se guardan al marcar.</p>
        </div>
    );
};
