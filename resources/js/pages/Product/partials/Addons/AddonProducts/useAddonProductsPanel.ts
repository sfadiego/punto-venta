import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { invalidateAddonQueries, useShowAddon, useSyncAddonProducts } from "@/services/useAddonService";
import { useIndexProducts } from "@/services/useProductService";
import { useIndexCategories } from "@/services/useCategoriesService";
import { filterProductsByName, groupProductsByCategory, toggleIdsInSet } from "@/utils/addonUtils";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { logUnexpectedError } from "@/plugins/logger.plugin";

// El panel necesita todos los productos del negocio para agruparlos por categoría; el
// catálogo de una cafetería queda muy por debajo de este tope.
const PRODUCTS_LIMIT = 1000;

/**
 * Asignación de un topping a productos desde el catálogo. Los cambios se guardan al marcar:
 * la selección vive en local (respuesta inmediata) y cada cambio encola un PUT que envía el
 * conjunto completo más reciente. Las peticiones corren una tras otra, así un clic rápido
 * nunca deja que una respuesta vieja pise a una nueva.
 */
export const useAddonProductsPanel = (addonId: number) => {
    const queryClient = useQueryClient();
    const { data: addon, isLoading: isLoadingAddon, isFetching, refetch } = useShowAddon(addonId);
    const { data: productsPage, isLoading: isLoadingProducts } = useIndexProducts({ limit: PRODUCTS_LIMIT, order: "asc" });
    const { data: categories } = useIndexCategories();
    const { mutateAsync: syncProducts } = useSyncAddonProducts();

    const [search, setSearch] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<number> | null>(null);
    const [pendingSaves, setPendingSaves] = useState(0);
    const latestRef = useRef<Set<number>>(new Set());
    const chainRef = useRef<Promise<void>>(Promise.resolve());
    const pendingRef = useRef(0);

    // Se siembra una sola vez, cuando llegan datos frescos del servidor.
    useEffect(() => {
        if (addon && !isFetching && selectedIds === null) {
            const initial = new Set(addon.product_ids ?? []);
            latestRef.current = initial;
            setSelectedIds(initial);
        }
    }, [addon, isFetching, selectedIds]);

    const products = useMemo(() => productsPage?.data ?? [], [productsPage]);
    const groups = useMemo(
        () => groupProductsByCategory(filterProductsByName(products, search), categories ?? []),
        [products, search, categories],
    );

    const enqueueSave = () => {
        pendingRef.current += 1;
        setPendingSaves((count) => count + 1);
        chainRef.current = chainRef.current.then(async () => {
            try {
                await syncProducts({ addonId, productIds: [...latestRef.current] });
            } catch (error) {
                logUnexpectedError(error, "useAddonProductsPanel.sync");
                toast.error(getUserFacingErrorMessage(error, "No se pudo guardar la asignación"));
                // Se vuelve a lo que realmente quedó guardado en el servidor.
                const { data: fresh } = await refetch();
                const restored = new Set(fresh?.product_ids ?? []);
                latestRef.current = restored;
                setSelectedIds(restored);
            } finally {
                pendingRef.current -= 1;
                setPendingSaves((count) => count - 1);
                if (pendingRef.current === 0) {
                    invalidateAddonQueries(queryClient);
                }
            }
        });
    };

    const applySelection = (next: Set<number>) => {
        latestRef.current = next;
        setSelectedIds(next);
        enqueueSave();
    };

    const toggleProduct = (productId: number) => applySelection(toggleIdsInSet(latestRef.current, [productId]));
    const toggleCategory = (productIds: number[]) => applySelection(toggleIdsInSet(latestRef.current, productIds));

    return {
        addon,
        groups,
        search,
        setSearch,
        selectedIds: selectedIds ?? new Set<number>(),
        selectedCount: selectedIds?.size ?? 0,
        totalProducts: productsPage?.total ?? products.length,
        isLoading: isLoadingAddon || isLoadingProducts || selectedIds === null,
        isSaving: pendingSaves > 0,
        toggleProduct,
        toggleCategory,
    };
};
