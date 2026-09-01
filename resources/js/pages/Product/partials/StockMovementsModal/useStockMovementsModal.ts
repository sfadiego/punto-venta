import { useMemo, useState } from "react";
import { useInfiniteStockMovements } from "@/services/useProductService";
import { IProduct } from "@/models/IProduct";

// El producto a consultar se selecciona desde la fila de la tabla (ProductTableActions),
// igual patrón que useRestockModal — el modal vive a nivel de página. Con variantes, el
// kardex es por variante — se elige cuál ver desde un selector dentro del modal.
export const useStockMovementsModal = () => {
    const [product, setProduct] = useState<IProduct | null>(null);
    const [variantId, setVariantId] = useState<string>("");

    const activeVariants = (product?.variants ?? []).filter((v) => v.activo);
    const hasVariants = activeVariants.length > 0;
    const selectedVariant = activeVariants.find((v) => String(v.id) === variantId) ?? null;

    // Con variantes, no hay "kardex agregado" — se espera a que se elija una antes de pedir
    // el historial (evita una consulta vacía por defecto contra movimientos sin variante).
    const canQuery = !hasVariants || !!selectedVariant;
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteStockMovements(canQuery ? (product?.id ?? null) : null, selectedVariant?.id ?? null);
    const movements = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

    const openMovementsModal = (p: IProduct) => setProduct(p);
    const closeMovementsModal = () => {
        setProduct(null);
        setVariantId("");
    };

    return {
        isOpen: !!product,
        product,
        hasVariants,
        activeVariants,
        variantId,
        setVariantId,
        selectedVariant,
        movements,
        isLoading,
        isFetchingNextPage,
        hasNextPage: !!hasNextPage,
        fetchNextPage,
        openMovementsModal,
        closeMovementsModal,
    };
};
