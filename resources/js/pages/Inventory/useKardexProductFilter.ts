import { useState } from "react";
import { IProduct } from "@/models/IProduct";
import { useIndexProducts } from "@/services/useProductService";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

// Sub-hook del combobox de producto (ProductAutocomplete) usado para filtrar el Kardex —
// separado de useInventoryPage porque es un dominio propio (búsqueda/selección de producto),
// distinto de la paginación y los filtros de tipo/razón/fecha del listado. No se importa
// directo desde InventoryPage: useInventoryPage lo orquesta y re-exporta.
export const useKardexProductFilter = () => {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebouncedValue(query);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [productId, setProductId] = useState<number | null>(null);

    const { data: productsPage } = useIndexProducts({
        nombre: debouncedQuery || undefined,
        limit: 20,
        enabled: isDropdownOpen,
    });
    const suggestions = productsPage?.data ?? [];

    // Escribir invalida la selección previa (ya no corresponde a lo que se ve en el input)
    // y reabre el desplegable de sugerencias.
    const handleQueryChange = (value: string) => {
        setQuery(value);
        setProductId(null);
        setIsDropdownOpen(true);
    };

    const selectProduct = (selected: IProduct) => {
        setQuery(selected.nombre);
        setProductId(selected.id);
        setIsDropdownOpen(false);
    };

    const clear = () => {
        setQuery("");
        setProductId(null);
    };

    return {
        query,
        handleQueryChange,
        suggestions,
        isDropdownOpen,
        setIsDropdownOpen,
        productId,
        selectProduct,
        clear,
    };
};
