import { useMemo } from "react";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { ReturnReasonEnum } from "@/enums/ReturnReasonEnum";
import { IOrder } from "@/models/IOrder";
import { IOrderProduct } from "@/models/IOrderProduct";
import { IOrderReturn } from "@/models/IOrderReturn";
import { IOrderReturnForm, IReturnLineValue } from "@/models/IOrderReturnForm";
import { useAxios } from "@/hooks/useAxios";
import { usePrintReceiptPrompt } from "@/components/orders/PrintTicket/usePrintReceiptPrompt";
import { invalidateOrderReturnQueries, useCreateOrderReturn } from "@/services/useOrderService";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { resolveDefaultPaymentMethodId } from "@/utils/paymentMethods";
import { buildReturnLineValues, calcReturnableQuantity, selectAllReturnLines, sumReturnPieces, toggleReturnLine } from "@/utils/returnCalc";
import { calcReturnRefund } from "@/utils/returnRefundCalc";
import { buildOrderReturnSchema } from "@/utils/orderReturnSchema";

interface UseReturnFormParams {
    order: IOrder | null;
    lines: IOrderProduct[];
    /** Se llama tras registrar la devolución, para volver a la búsqueda de orden (o cerrar el modal). */
    onDone: () => void;
}

// Formulario de devolución: líneas marcadas con su cantidad, motivo, nota y si se devuelve dinero (y
// por qué método). Las reglas de cada línea (máximo devolvible, enteros en unidad) viven en el
// esquema, que cambia con la orden.
export const useReturnForm = ({ order, lines, onDone }: UseReturnFormParams) => {
    const queryClient = useQueryClient();
    const { sistemaId } = useAxios();
    const { mutateAsync: createReturn } = useCreateOrderReturn();
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const promptReceipt = usePrintReceiptPrompt();

    // El reembolso sale por el método con el que se pagó la venta; si ya no está activo (o fue a
    // crédito), por el de uso más común.
    const defaultMethodId = useMemo(() => {
        const saleMethod = paymentMethods.find((method) => method.id === order?.payment_method_id && method.active);
        return saleMethod?.id ?? resolveDefaultPaymentMethodId(paymentMethods);
    }, [paymentMethods, order?.payment_method_id]);

    const initialValues = useMemo<IOrderReturnForm>(
        () => ({ reason: "", note: "", refund: true, payment_method_id: defaultMethodId, items: buildReturnLineValues(lines) }),
        [lines, defaultMethodId],
    );

    // Lo que saldría por método de pago con las líneas marcadas — decide si el método es obligatorio.
    const methodAmountOf = useMemo(
        () => (items: IReturnLineValue[]) => (order ? calcReturnRefund(order, lines, items).methodAmount : 0),
        [order, lines],
    );
    const schema = useMemo(() => buildOrderReturnSchema(lines, methodAmountOf), [lines, methodAmountOf]);

    const formik = useFormik<IOrderReturnForm>({
        enableReinitialize: true,
        initialValues,
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            if (!order || values.reason === "") return;
            const selected = values.items.filter((item) => item.selected);
            const sendsMethod = values.refund && values.payment_method_id !== null && methodAmountOf(values.items) > 0;

            try {
                const response = await createReturn({
                    orderId: order.id,
                    data: {
                        reason: values.reason as ReturnReasonEnum,
                        note: values.note.trim() || undefined,
                        refund: values.refund,
                        ...(sendsMethod ? { refund_payment_method_id: values.payment_method_id as number } : {}),
                        items: selected.map((item) => ({ order_product_id: item.order_product_id, quantity: Number(item.quantity) })),
                    },
                });
                invalidateOrderReturnQueries(queryClient, { orderId: order.id, sistemaId, customerId: order.customer_id });
                toast.success(selected.length === 1 ? "Devolución registrada" : `Devolución registrada (${selected.length} productos)`);
                // El comprobante se ofrece antes de cerrar: onDone puede desmontar este flujo (cierra el modal) y
                // la impresión debe salir de un componente vivo.
                await promptReceipt(order.id, (response.data as { data: IOrderReturn }).data.id);
                helpers.resetForm();
                onDone();
            } catch (error) {
                logUnexpectedError(error, "useReturnForm.onSubmit");
                toast.error(getUserFacingErrorMessage(error, "Error al registrar la devolución"));
            }
        },
    });

    const { values, setFieldValue } = formik;
    const returnableIndexes = lines.map((line, index) => (calcReturnableQuantity(line) > 0 ? index : -1)).filter((index) => index >= 0);
    const selectedCount = values.items.filter((item) => item.selected).length;
    const returnableCount = returnableIndexes.length;

    return {
        formik,
        selectedCount,
        returnableCount,
        piecesCount: sumReturnPieces(values.items),
        allReturnableSelected: returnableIndexes.length > 0 && returnableIndexes.every((index) => values.items[index]?.selected),
        toggleLine: (index: number, selected: boolean) => setFieldValue(`items.${index}`, toggleReturnLine(lines[index], values.items[index], selected)),
        setQuantity: (index: number, quantity: string) => setFieldValue(`items.${index}.quantity`, quantity),
        selectAll: () => setFieldValue("items", selectAllReturnLines(lines, values.items)),
        clearSelection: () => setFieldValue("items", buildReturnLineValues(lines)),
        setRefund: (refund: boolean) => setFieldValue("refund", refund),
        setPaymentMethod: (paymentMethodId: number) => setFieldValue("payment_method_id", paymentMethodId),
    };
};
