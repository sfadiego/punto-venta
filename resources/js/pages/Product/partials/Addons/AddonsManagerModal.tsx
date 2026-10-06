import { Loader, Plus, Search, Tags, X } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { AddonDetailModal } from "./AddonDetail/AddonDetailModal";
import { AddonProductsPanel } from "./AddonProducts/AddonProductsPanel";
import { AddonListItem } from "./AddonListItem";
import { useAddonsManagerModal } from "./useAddonsManagerModal";

interface AddonsManagerModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Catálogo de toppings del negocio: lista a la izquierda (crear, editar, borrar) y, al elegir
 * uno, los productos donde se ofrece a la derecha. En pantallas chicas el panel pasa debajo.
 */
export const AddonsManagerModal = ({ isOpen, onClose }: AddonsManagerModalProps) => {
    const manager = useAddonsManagerModal(isOpen);

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

                <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4 border-b border-stone-100">
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                                <Tags size={16} className="text-amber-600" />
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-semibold text-stone-900 text-sm">Toppings</h2>
                                <p className="text-xs text-stone-400 mt-0.5">Catálogo del negocio</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={manager.openCreate}
                                className="flex items-center gap-1.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 px-3 py-2 rounded-xl transition-colors"
                            >
                                <Plus size={15} />
                                Nuevo topping
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                aria-label="Cerrar"
                                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] overflow-y-auto md:overflow-hidden">
                        <div className="p-4 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-stone-100 min-w-0">
                            <Input
                                name="addon_catalog_search"
                                icon={<Search size={14} />}
                                placeholder="Buscar topping..."
                                value={manager.search}
                                onChange={(event) => manager.setSearch(event.target.value)}
                                autoComplete="off"
                            />

                            <div className="flex flex-col gap-0.5 max-h-60 md:max-h-[52vh] overflow-y-auto">
                                {manager.isLoading ? (
                                    <div className="flex items-center justify-center gap-2 py-10 text-sm text-stone-400">
                                        <Loader size={16} className="animate-spin" />
                                        Cargando toppings...
                                    </div>
                                ) : manager.filteredAddons.length === 0 ? (
                                    <p className="py-10 text-center text-sm text-stone-400">
                                        {manager.addons.length === 0
                                            ? "Aún no hay toppings. Crea el primero."
                                            : "Ningún topping coincide."}
                                    </p>
                                ) : (
                                    manager.filteredAddons.map((addon) => (
                                        <AddonListItem
                                            key={addon.id}
                                            addon={addon}
                                            isSelected={manager.selectedId === addon.id}
                                            isDeleting={manager.deletingId === addon.id}
                                            onSelect={manager.setSelectedId}
                                            onEdit={manager.openEdit}
                                            onDelete={manager.handleDelete}
                                        />
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="p-4 min-w-0 md:overflow-y-auto">
                            {manager.selectedAddon ? (
                                <AddonProductsPanel key={manager.selectedAddon.id} addonId={manager.selectedAddon.id} />
                            ) : (
                                <p className="py-16 text-center text-sm text-stone-400">
                                    Elige un topping para ver en qué productos se ofrece.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AddonDetailModal
                isOpen={manager.isDetailOpen}
                addon={manager.editingAddon}
                onSaved={manager.handleSaved}
                onClose={manager.closeDetail}
            />
        </>
    );
};
