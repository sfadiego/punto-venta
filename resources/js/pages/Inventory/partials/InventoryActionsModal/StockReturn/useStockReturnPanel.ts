import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";
import { IOrderSummary } from "@/models/IOrder";
import { useShowOrder, useListClosedOrders, useReturnOrderProduct } from "@/services/useOrderService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

export type StockReturnForm = {
    quantity: string;
    note: string;
};

const schema = Yup.object({
    quantity: Yup.number()
        .typeError("Ingresa una cantidad válida")
        .moreThan(0, "La cantidad debe ser mayor a 0")
        .required("La cantidad es requerida"),
    note: Yup.string().max(255, "Máximo 255 caracteres"),
});

// Pestaña "Devolución" del modal de acciones de Inventario (InventoryActionsModal). Devolución
// de stock ligada a una línea de una orden ya cerrada. El usuario busca la orden por
// nombre/cliente en un combobox (sin límite de sesión/fecha, ver useListClosedOrders), elige
// la línea a devolver e indica cuántas unidades — el backend valida que no exceda lo vendido
// menos lo ya devuelto (permite devoluciones parciales repetidas). Sin isOpen/openModal/
// closeModal propios — el modal que lo contiene decide qué pestaña se muestra.
export const useStockReturnPanel = () => {
    const queryClient = useQueryClient();
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [orderId, setOrderId] = useState<number | null>(null);
    const [orderProductId, setOrderProductId] = useState<number | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQuery(query), 400);
        return () => clearTimeout(timer);
    }, [query]);

    const { data: suggestionsData } = useListClosedOrders(debouncedQuery, isDropdownOpen);
    const suggestions = suggestionsData ?? [];

    const { data: order, isLoading: isLoadingOrder } = useShowOrder(orderId ?? 0);
    const { mutateAsync: returnStock } = useReturnOrderProduct();

    const lines = (order?.order_products ?? []).filter((op) => !!op.producto_id);
    const isOrderClosed = order?.estatus_pedido_id === OrderStatusEnum.Closed;
    const selectedLine = lines.find((op) => op.id === orderProductId) ?? null;
    const canSubmit = !!order && isOrderClosed && !!selectedLine;

    const reset = () => {
        formik.resetForm();
        setQuery("");
        setDebouncedQuery("");
        setIsDropdownOpen(false);
        setOrderId(null);
        setOrderProductId(null);
    };

    const formik = useFormik<StockReturnForm>({
        enableReinitialize: true,
        initialValues: { quantity: "", note: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            if (!canSubmit || !order || !selectedLine) return;

            try {
                await returnStock({
                    orderId: order.id,
                    orderProductId: selectedLine.id!,
                    data: {
                        quantity: Number(values.quantity),
                        note: values.note.trim() || undefined,
                    },
                });
                queryClient.invalidateQueries({ queryKey: [ApiRoutes.Product] });
                queryClient.invalidateQueries({ queryKey: [ApiRoutes.Kardex] });
                queryClient.invalidateQueries({ queryKey: [ApiRoutes.Orders] });
                // useShowOrder cachea con la key exacta "order/{id}" — sin esto, una segunda
                // devolución parcial sobre la misma orden (dentro del staleTime de 2 min) ve
                // las líneas con la cantidad ya devuelta desactualizada.
                queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Orders}/${order.id}`] });
                toast.success(`Devolución registrada para "${selectedLine.product?.nombre}"`);
                helpers.resetForm();
                setQuery("");
                setOrderId(null);
                setOrderProductId(null);
            } catch (error) {
                logUnexpectedError(error, "useStockReturnPanel.onSubmit");
                toast.error(getUserFacingErrorMessage(error, "Error al registrar la devolución"));
            }
        },
    });

    // Escribir invalida la orden ya elegida y reabre el desplegable de sugerencias.
    const handleQueryChange = (value: string) => {
        setQuery(value);
        setOrderId(null);
        setOrderProductId(null);
        setIsDropdownOpen(true);
    };

    const selectOrder = (selected: IOrderSummary) => {
        setQuery(`#${selected.id} · ${selected.nombre_pedido}`);
        setOrderId(selected.id);
        setOrderProductId(null);
        setIsDropdownOpen(false);
    };

    return {
        query,
        handleQueryChange,
        suggestions,
        isDropdownOpen,
        setIsDropdownOpen,
        selectOrder,
        order: order ?? null,
        isLoadingOrder,
        isOrderClosed,
        lines,
        orderProductId,
        setOrderProductId,
        selectedLine,
        canSubmit,
        formik,
        reset,
    };
};
