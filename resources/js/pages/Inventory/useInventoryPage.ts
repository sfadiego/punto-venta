import { useState } from "react";
import { StockMovementTypeEnum } from "@/enums/StockMovementTypeEnum";
import { StockMovementReasonEnum } from "@/enums/StockMovementReasonEnum";
import { REASONS_BY_TYPE } from "@/utils/stockMovementFilters";
import { useIndexKardex } from "@/services/useKardexService";
import { useKardexProductFilter } from "./useKardexProductFilter";

const PAGE_SIZE_OPTIONS = [15, 30, 50];

// Filtros + paginación del kardex global de Inventario. El listado siempre viene ordenado
// más reciente primero (forzado en el backend, KardexService::orderQuery) — no hay control
// de orden aquí. El filtro por producto es un dominio propio, delegado a
// useKardexProductFilter (combobox de búsqueda/selección) y compuesto aquí.
export const useInventoryPage = () => {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(15);
    const [type, setTypeState] = useState<StockMovementTypeEnum | "">("");
    const [reason, setReasonState] = useState<StockMovementReasonEnum | "">("");
    const [fechaDesde, setFechaDesdeState] = useState("");
    const [fechaHasta, setFechaHastaState] = useState("");

    const productFilter = useKardexProductFilter(() => setPage(1));

    const { data, isLoading, refetch } = useIndexKardex({
        page,
        limit,
        productId: productFilter.productId,
        type,
        reason,
        fechaDesde: fechaDesde || undefined,
        fechaHasta: fechaHasta || undefined,
    });

    // Tipo y razón no son independientes (ver utils/stockMovementFilters.ts) — cada setter
    // sincroniza al otro filtro para que nunca queden en una combinación imposible (ej.
    // Tipo=Entrada + Razón=Venta, que solo devolvería una tabla vacía sin explicar por qué).
    const setType = (value: string) => {
        const nextType = value as StockMovementTypeEnum | "";
        setTypeState(nextType);
        // El selector de razón se oculta sin un tipo elegido (ver InventoryPage.tsx) — al
        // limpiar el tipo, o al cambiarlo a uno que ya no admite la razón actual, la razón
        // también se limpia para no dejar un filtro invisible pero todavía aplicado.
        if (!nextType || (reason && !REASONS_BY_TYPE[nextType].includes(reason))) {
            setReasonState("");
        }
        setPage(1);
    };

    const setReason = (value: string) => {
        setReasonState(value as StockMovementReasonEnum | "");
        setPage(1);
    };

    const setFechaDesde = (value: string) => {
        setFechaDesdeState(value);
        setPage(1);
    };

    const setFechaHasta = (value: string) => {
        setFechaHastaState(value);
        setPage(1);
    };

    return {
        movements: data?.data ?? [],
        total: data?.total ?? 0,
        page,
        limit,
        pageSize: PAGE_SIZE_OPTIONS,
        isLoading,
        refetch,
        setPage,
        setLimit,
        type,
        setType,
        reason,
        setReason,
        fechaDesde,
        setFechaDesde,
        fechaHasta,
        setFechaHasta,
        productFilter,
    };
};
