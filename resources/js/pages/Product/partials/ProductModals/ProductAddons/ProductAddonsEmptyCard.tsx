import { Plus, Tags } from "lucide-react";

interface ProductAddonsEmptyCardProps {
    isLoading: boolean;
    /** El catálogo del negocio no tiene ningún topping todavía. */
    catalogIsEmpty: boolean;
    canCreate: boolean;
    onAdd: () => void;
}

/** Estado vacío del campo de toppings: explica qué hacer en vez de mostrar un input sin contenido. */
export const ProductAddonsEmptyCard = ({ isLoading, catalogIsEmpty, canCreate, onAdd }: ProductAddonsEmptyCardProps) => {
    // Sin toppings en el catálogo y sin permiso para crearlos no hay nada que agregar: se informa y no se ofrece el botón.
    const canAdd = !isLoading && (!catalogIsEmpty || canCreate);

    let description = "Elige los que se ofrecen con este producto.";
    if (isLoading) description = "Cargando toppings...";
    else if (catalogIsEmpty) {
        description = canCreate
            ? "Aún no hay toppings en el catálogo. Crea el primero."
            : "Aún no hay toppings en el catálogo. Pide a un administrador que los cree.";
    }

    return (
        <div className="flex flex-wrap items-center gap-3 border border-dashed border-stone-300 rounded-xl bg-stone-50 px-3.5 py-3">
            <span className="w-9 h-9 shrink-0 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                <Tags size={16} />
            </span>
            <div className="flex-1 min-w-[10rem]">
                <p className="text-sm font-semibold text-stone-800">Sin toppings</p>
                <p className="text-xs text-stone-500">{description}</p>
            </div>
            {canAdd && (
                <button
                    type="button"
                    onClick={onAdd}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3.5 py-1.5 transition-colors"
                >
                    <Plus size={14} />
                    Agregar
                </button>
            )}
        </div>
    );
};
