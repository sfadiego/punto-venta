import { useReturnOrderSearch } from "./ReturnOrder/useReturnOrderSearch";
import { useReturnForm } from "./useReturnForm";
import { useReturnRefund } from "./ReturnRefund/useReturnRefund";

export type OrderReturnPanelState = ReturnType<typeof useOrderReturnPanel>;

interface UseOrderReturnPanelOptions {
    /** Orden ya elegida (devolución desde el detalle de una venta): oculta el buscador. */
    initialOrderId?: number;
    /** Se llama tras registrar la devolución — ej. para cerrar el modal que la contiene. */
    onReturned?: () => void;
}

// Devolución de una o varias líneas de una orden ya cerrada, con su motivo y el reembolso. La usan la
// pestaña "Devolución" del modal de Inventario (con buscador de orden) y el modal que se abre desde el
// detalle de una venta (con la orden ya elegida). Compone la búsqueda de la orden, el formulario y el
// reembolso — sin isOpen/openModal/closeModal propios, el modal que la contiene decide cuándo se muestra.
export const useOrderReturnPanel = ({ initialOrderId, onReturned }: UseOrderReturnPanelOptions = {}) => {
    const search = useReturnOrderSearch(initialOrderId);
    const form = useReturnForm({
        order: search.order,
        lines: search.lines,
        // Con la orden fija no se vuelve al buscador: el modal que la contiene se cierra.
        onDone: () => {
            if (search.canChangeOrder) search.clearOrder();
            onReturned?.();
        },
    });
    const refund = useReturnRefund({ order: search.order, lines: search.lines, values: form.formik.values });

    const reset = () => {
        form.formik.resetForm();
        search.reset();
    };

    return { ...search, ...form, refund, reset };
};
