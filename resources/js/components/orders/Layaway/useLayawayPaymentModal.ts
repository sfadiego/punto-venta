import { useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAxios } from "@/hooks/useAxios";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
import { invalidateLayawayQueries, useAddLayawayPayment } from "@/services/useLayawayService";
import { useLayawayReceiptPrompt } from "./useLayawayReceiptPrompt";
import { IOrder } from "@/models/IOrder";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { resolveDefaultPaymentMethodId } from "@/utils/paymentMethods";
import { formatCurrency } from "@/utils/formatCurrency";
import { calcLayawayBalance } from "@/utils/layawayCalc";

export type LayawayPaymentForm = {
    amount: string;
    payment_method_id: number | null;
};

// Abono a un apartado existente (modal "Abonar"): el monto no puede exceder el saldo pendiente
// y, si lo cubre exacto, el backend liquida y cierra la venta.
export const useLayawayPaymentModal = (order: IOrder, onClose: () => void) => {
    const queryClient = useQueryClient();
    const { sistemaId } = useAxios();
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const { mutateAsync: addPayment, isPending } = useAddLayawayPayment();
    const promptReceipt = useLayawayReceiptPrompt();

    const pending = calcLayawayBalance(order.total, order.amount_paid);

    const schema = useMemo(
        () =>
            Yup.object({
                amount: Yup.number()
                    .typeError("Ingresa un monto válido")
                    .required("Ingresa el monto del abono")
                    .min(0.01, "Debe ser mayor a 0")
                    .max(pending, `El abono no puede exceder el saldo pendiente (${formatCurrency(pending)})`),
                payment_method_id: Yup.number().nullable().required("Selecciona un método de pago"),
            }),
        [pending],
    );

    const formik = useFormik<LayawayPaymentForm>({
        initialValues: { amount: "", payment_method_id: resolveDefaultPaymentMethodId(paymentMethods) },
        enableReinitialize: true,
        validationSchema: schema,
        onSubmit: async (values) => {
            if (!sistemaId || values.payment_method_id === null) return;
            const completes = Math.abs(Number(values.amount) - pending) < 0.005;
            try {
                await addPayment({
                    orderId: order.id,
                    data: { amount: Number(values.amount), payment_method_id: values.payment_method_id, sistema_id: sistemaId },
                });
                invalidateLayawayQueries(queryClient, { orderId: order.id, customerId: order.customer_id, sistemaId });
                toast.success(completes ? "Apartado liquidado, la venta quedó cerrada" : "Abono registrado correctamente");
                await promptReceipt(order.id);
                onClose();
            } catch (error) {
                logUnexpectedError(error, "useLayawayPaymentModal.submit");
                toast.error(getUserFacingErrorMessage(error, "Error al registrar el abono"));
            }
        },
    });

    const amount = parseFloat(formik.values.amount) || 0;

    return {
        formik,
        paymentMethods,
        pending,
        amount,
        completes: amount > 0 && Math.abs(amount - pending) < 0.005,
        canSubmit: !!sistemaId && !isPending && schema.isValidSync(formik.values),
        isPending,
        payAll: () => formik.setFieldValue("amount", String(pending)),
    };
};
