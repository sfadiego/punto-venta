import { FormikProps } from "formik";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/form/Input";
import { IAddon } from "@/models/IAddon";
import { ProductForm } from "../useProductModal";
import { ProductAddonChips } from "./ProductAddonChips";
import { ProductAddonOptions } from "./ProductAddonOptions";
import { ProductAddonsEmptyCard } from "./ProductAddonsEmptyCard";
import { useProductAddonsField } from "./useProductAddonsField";

interface ProductAddonsFieldProps {
    formik: FormikProps<ProductForm>;
    /** Toppings que el producto ya tiene asignados (incluye los inactivos, para poder mostrarlos). */
    productAddons: IAddon[];
}

/**
 * Selección múltiple de toppings del producto. Sin toppings asignados muestra una tarjeta de
 * estado vacío; con ellos, una caja con chips y una píldora "+ Agregar topping" que abre el
 * buscador con la lista del catálogo. Mantiene una altura casi fija sin importar el tamaño
 * del catálogo (a diferencia de un checklist).
 */
export const ProductAddonsField = ({ formik, productAddons }: ProductAddonsFieldProps) => {
    const field = useProductAddonsField(formik, productAddons);

    const showEmptyCard = field.selected.length === 0 && !field.isSearching;

    return (
        <div>
            <div className="flex items-baseline justify-between mb-1.5">
                <label htmlFor="addon_search" className="block text-sm font-medium text-stone-700">
                    Toppings
                </label>
                <span className="font-mono text-xs text-stone-500">
                    {field.selected.length > 0 ? `${field.selected.length} de ${field.catalogSize}` : "Ninguno"}
                </span>
            </div>

            {showEmptyCard ? (
                <ProductAddonsEmptyCard
                    isLoading={field.isLoading}
                    catalogIsEmpty={field.catalogSize === 0}
                    canCreate={field.canCreateAddons}
                    onAdd={field.startSearching}
                />
            ) : (
                <>
                    {/* Caja única con borde: chips + buscador (o píldora "+ Agregar"). El Input se
                        despoja de su borde, padding y anillo propios (inputStyle "none" + overrides) y
                        el foco se dibuja en la caja con focus-within. */}
                    <div className="flex flex-wrap items-center gap-1.5 bg-white border border-stone-300 rounded-xl px-2 py-1.5 hover:border-stone-400 focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-transparent transition-all">
                        <ProductAddonChips
                            selected={field.selected}
                            expanded={field.chipsExpanded}
                            onToggleExpanded={field.toggleChipsExpanded}
                            onRemove={field.toggle}
                        />

                        {field.isSearching ? (
                            <Input
                                name="addon_search"
                                inputStyle="none"
                                containerClassName="flex-1 min-w-[9rem]"
                                className="!border-0 !rounded-none !px-1 !py-1 focus:!ring-0 hover:!border-0"
                                placeholder={field.catalogSize === 0 ? "Escribe el nombre del primer topping..." : "Buscar o crear topping..."}
                                value={field.query}
                                onChange={(event) => field.handleQueryChange(event.target.value)}
                                onBlur={field.stopSearching}
                                onKeyDown={field.handleKeyDown}
                                autoComplete="off"
                                autoFocus
                            />
                        ) : (
                            <button
                                type="button"
                                onClick={field.startSearching}
                                className="inline-flex items-center gap-1 rounded-full border border-dashed border-amber-500 text-amber-600 hover:bg-amber-50 text-xs font-semibold px-3 py-1 transition-colors"
                            >
                                <Plus size={13} />
                                Agregar topping
                            </button>
                        )}
                    </div>

                    {field.isSearching && (
                        // preventDefault en mousedown evita que el input pierda el foco (y cierre la
                        // lista) antes de que el clic llegue a la opción.
                        <div onMouseDown={(event) => event.preventDefault()}>
                            <ProductAddonOptions
                                addons={field.filtered}
                                selectedIds={field.selectedIds}
                                activeIndex={field.activeIndex}
                                isLoading={field.isLoading}
                                isCreating={field.isCreating}
                                showCreate={field.showCreate}
                                query={field.query}
                                catalogSize={field.catalogSize}
                                onToggle={field.toggle}
                                onCreate={field.createAddon}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
