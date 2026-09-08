import { useEffect, useRef } from "react";
import { Input } from "@/components/ui/form/Input";
import { IProduct } from "@/models/IProduct";

interface ProductAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    suggestions: IProduct[];
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSelect: (product: IProduct) => void;
    label?: string;
    placeholder?: string;
    className?: string;
    /** true = el desplegable empuja el contenido en vez de flotar encima (usarlo dentro de un
     * modal con overflow-hidden, ej. StockAdjustmentModal, para que las opciones no se
     * recorten ni se salgan de la tarjeta). Default false = flota sobre el contenido (uso en
     * la barra de filtros del Kardex, donde no hay overflow-hidden estorbando). */
    inline?: boolean;
}

// Combobox de un solo input: escribir filtra productos, las coincidencias aparecen
// desplegadas debajo y se seleccionan ahí mismo — evita tener un input de búsqueda y un
// <select> separados para lo mismo. Mismo patrón que AddressAutocomplete. Se usa tanto para
// elegir el producto a reajustar (StockAdjustmentModal) como para filtrar el kardex por
// producto (InventoryPage).
export const ProductAutocomplete = ({
    value,
    onChange,
    suggestions,
    isOpen,
    setIsOpen,
    onSelect,
    label = "Producto *",
    placeholder = "Busca un producto...",
    className,
    inline = false,
}: ProductAutocompleteProps) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [setIsOpen]);

    return (
        <div ref={containerRef} className={`relative ${className ?? ""}`}>
            <Input
                name="product_search"
                label={label}
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsOpen(true)}
                autoComplete="off"
            />

            {isOpen && (
                <ul
                    className={`${inline ? "" : "absolute top-full left-0 right-0 z-50"} mt-1 bg-white border border-stone-200 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto`}
                >
                    {suggestions.length === 0 && (
                        <li className="px-3 py-2.5 text-xs text-stone-400 text-center">Sin productos que coincidan</li>
                    )}
                    {suggestions.map((product) => (
                        <li key={product.id}>
                            <button
                                type="button"
                                onClick={() => onSelect(product)}
                                className="w-full text-left px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 border-b border-stone-100 last:border-0"
                            >
                                {product.nombre}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};
