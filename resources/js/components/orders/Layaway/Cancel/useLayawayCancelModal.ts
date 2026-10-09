import { useMemo } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAxios } from "@/hooks/useAxios";
import { useCashOnHand } from "@/hooks/useCashOnHand";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
import { invalidateLayawayQueries, useCancelLayaway } from "@/services/useLayawayService";
import { IOrder } from "@/models/IOrder";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { formatCurrency } from "@/utils/formatCurrency";
import { isCashMethodName, resolveDefaultPaymentMethodId } from "@/utils/paymentMethods";
import { DEFAULT_LAYAWAY_RETENTION_PERCENT, calcDepositFromPercent, splitLayawayRefund } from "@/utils/layawayCalc";

export type LayawayCancelForm = {
    retained_amount: string;
    payment_method_id: number | null;
    note: string;
};

export type LayawayCancel = ReturnType<typeof useLayawayCancelModal>;

// Cancelación de un apartado: devuelve el stock y reembolsa lo abonado, salvo lo que el negocio
// retiene (quien cancela decide, con un % sugerido por el negocio). Avisa si el reembolso en efectivo
// dejaría la caja en negativo.
export const useLayawayCancelModal = (order: IOrder, onClose: () => void) => {
    const queryClient = useQueryClient();
    const { sistemaId } = useAxios();
    const { data: config } = useGetBusinessConfig();
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const { cashOnHand } = useCashOnHand();
    const { mutateAsync: cancelLayaway, isPending } = useCancelLayaway();

    const paid = Number(order.amount_paid) || 0;
    const suggestedPercent = config?.layaway_retention_percent ?? DEFAULT_LAYAWAY_RETENTION_PERCENT;

    const schema = useMemo(
        () =>
            Yup.object({
                retained_amount: Yup.number()
                    .typeError("Ingresa un monto válido")
                    .min(0, "No puede ser negativo")
                    .max(paid, `No puede exceder lo abonado (${formatCurrency(paid)})`),
                payment_method_id: Yup.number().nullable(),
                note: Yup.string().max(500, "Máximo 500 caracteres"),
            }),
        [paid],
    );

    const formik = useFormik<LayawayCancelForm>({
        initialValues: {
            // Precarga la retención sugerida por el negocio (0 = reembolso total); se puede ajustar.
            retained_amount: String(calcDepositFromPercent(paid, suggestedPercent)),
            payment_method_id: resolveDefaultPaymentMethodId(paymentMethods),
            note: "",
        },
        enableReinitialize: true,
        validationSchema: schema,
        onSubmit: async (values) => {
            if (!sistemaId) return;
            const { retained, refund } = splitLayawayRefund(paid, Number(values.retained_amount) || 0);
            try {
                await cancelLayaway({
                    orderId: order.id,
                    data: {
                        sistema_id: sistemaId,
                        retained_amount: retained,
                        ...(refund > 0 && values.payment_method_id ? { payment_method_id: values.payment_method_id } : {}),
                        ...(values.note.trim() ? { note: values.note.trim() } : {}),
                    },
                });
                invalidateLayawayQueries(queryClient, { orderId: order.id, customerId: order.customer_id, sistemaId });
                toast.success(
                    retained > 0
                        ? `Apartado cancelado: reembolso ${formatCurrency(refund)}, retenido ${formatCurrency(retained)}`
                        : "Apartado cancelado y reembolsado",
                );
                onClose();
            } catch (error) {
                logUnexpectedError(error, "useLayawayCancelModal.submit");
                toast.error(getUserFacingErrorMessage(error, "Error al cancelar el apartado"));
            }
        },
    });

    const { retained, refund } = splitLayawayRefund(paid, Number(formik.values.retained_amount) || 0);
    const selectedMethod = paymentMethods.find((method) => method.id === formik.values.payment_method_id);
    const refundsInCash = refund > 0 && !!selectedMethod && isCashMethodName(selectedMethod.name);
    const hasCashShortage = refundsInCash && cashOnHand !== null && refund > cashOnHand;

    return {
        formik,
        paid,
        suggestedPercent,
        retained,
        refund,
        paymentMethods,
        cashOnHand,
        hasCashShortage,
        canSubmit: !!sistemaId && !isPending && schema.isValidSync(formik.values),
        isPending,
        setRetained: (amount: number) => formik.setFieldValue("retained_amount", String(amount)),
    };
};
