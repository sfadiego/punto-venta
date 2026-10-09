import { useEffect, useMemo, useState } from "react";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { IOrderSummary } from "@/models/IOrder";
import { useShowOrder, useListClosedOrders } from "@/services/useOrderService";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { sortReturnLines } from "@/utils/returnCalc";
import { isReturnWindowOpen, returnWindowMessage } from "@/utils/returnWindow";

// Búsqueda de la orden a devolver: el usuario escribe nombre/cliente/folio en un combobox (sin
// límite de sesión/fecha, ver useListClosedOrders) y al elegir una se carga completa con sus
// líneas. Solo se pueden devolver órdenes cerradas. Con `initialOrderId` (devolución desde el detalle
// de una venta) la orden ya viene elegida y no se puede cambiar.
export const useReturnOrderSearch = (initialOrderId?: number) => {
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [orderId, setOrderId] = useState<number | null>(initialOrderId ?? null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 400);
        return () => clearTimeout(timer);
    }, [query]);

    const { data: suggestionsData } = useListClosedOrders(debouncedQuery, isDropdownOpen);
    // Siempre fresca: el saldo del cliente y lo ya devuelto cambian fuera de esta pantalla. `isFetching` (no solo
    // `isLoading`) hace que el formulario espere a los datos actuales en vez de calcular con los de la caché.
    const { data: order, isFetching: isLoadingOrder } = useShowOrder(orderId ?? 0, true, { fresh: true });
    const { data: config } = useGetBusinessConfig();
    const returnDays = config?.return_days ?? 0;

    // Líneas con producto de catálogo — una línea sin producto (extra libre) no tiene stock que devolver.
    const lines = useMemo(() => (order?.order_products ?? []).filter((op) => !!op.producto_id), [order]);

    const lineEntries = useMemo(() => sortReturnLines(lines), [lines]);

    // Escribir invalida la orden ya elegida y reabre el desplegable de sugerencias.
    const handleQueryChange = (value: string) => {
        setQuery(value);
        setOrderId(null);
        setIsDropdownOpen(true);
    };

    const selectOrder = (selected: IOrderSummary) => {
        setQuery(`#${selected.id} · ${selected.nombre_pedido}`);
        setOrderId(selected.id);
        setIsDropdownOpen(false);
    };

    const clearOrder = () => {
        setQuery("");
        setOrderId(null);
    };

    // "Cambiar orden": vuelve al buscador con las sugerencias abiertas.
    const changeOrder = () => {
        clearOrder();
        setIsDropdownOpen(true);
    };

    const reset = () => {
        clearOrder();
        setDebouncedQuery("");
        setIsDropdownOpen(false);
    };

    return {
        query,
        handleQueryChange,
        suggestions: suggestionsData ?? [],
        isDropdownOpen,
        setIsDropdownOpen,
        selectOrder,
        order: order ?? null,
        isLoadingOrder,
        isOrderClosed: order?.estatus_pedido_id === OrderStatusEnum.Closed,
        // Por qué ya no se puede devolver esta orden (plazo vencido); null si el plazo sigue abierto.
        returnWindowError: order && !isReturnWindowOpen(order, returnDays) ? returnWindowMessage(returnDays) : null,
        lines,
        lineEntries,
        canChangeOrder: initialOrderId === undefined,
        clearOrder,
        changeOrder,
        reset,
    };
};
