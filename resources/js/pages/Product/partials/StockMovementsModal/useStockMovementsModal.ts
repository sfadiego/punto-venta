import { useMemo, useState } from "react";
import { useInfiniteStockMovements } from "@/services/useProductService";
import { IProduct } from "@/models/IProduct";

// El producto a consultar se selecciona desde la fila de la tabla (ProductTableActions),
// igual patrón que useRestockModal — el modal vive a nivel de página.
export const useStockMovementsModal = () => {
    const [product, setProduct] = useState<IProduct | null>(null);
    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useInfiniteStockMovements(product?.id ?? null);
    const movements = useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data]);

    const openMovementsModal = (p: IProduct) => setProduct(p);
    const closeMovementsModal = () => setProduct(null);

    return {
        isOpen: !!product,
        product,
        movements,
        isLoading,
        isFetchingNextPage,
        hasNextPage: !!hasNextPage,
        fetchNextPage,
        openMovementsModal,
        closeMovementsModal,
    };
};
