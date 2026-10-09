import { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { useAxios } from "@/hooks/useAxios";
import { usePermissions } from "@/hooks/usePermissions";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { useIndexPaymentMethods } from "@/services/usePaymentMethodService";
import { useCustomerList } from "@/services/useCustomerService";
import { invalidateLayawayQueries, useCreateLayaway } from "@/services/useLayawayService";
import { usePrintReceiptPrompt } from "@/components/orders/PrintTicket/usePrintReceiptPrompt";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { resolveDefaultPaymentMethodId } from "@/utils/paymentMethods";
import { computeLayawayDueDate } from "@/utils/dateUtils";
import { buildLayawaySchema } from "@/utils/layawaySchema";
import {
    DEFAULT_LAYAWAY_DAYS,
    DEFAULT_LAYAWAY_MIN_PERCENT,
    calcLayawayBalance,
    calcMinDeposit,
} from "@/utils/layawayCalc";

export type LayawayForm = {
    customer_id: number | null;
    amount: string;
    payment_method_id: number | null;
};

interface UseLayawayPayParams {
    orderId: number;
    total: number;
    isOpen: boolean;
    onSuccess: () => void;
}

export type LayawayPay = ReturnType<typeof useLayawayPay>;

// Modo "Apartar" del modal de cobro (retail): anticipo + cliente en vez de cobro completo.
// Lo comparten los dos flujos de cobro de retail (CartPanel y PayOrderButton) — cada uno solo
// instancia este hook y se lo pasa a RestaurantPayModal.
export const useLayawayPay = ({ orderId, total, isOpen, onSuccess }: UseLayawayPayParams) => {
    const queryClient = useQueryClient();
    const { features, sistemaId } = useAxios();
    const { can } = usePermissions();
    const { data: config } = useGetBusinessConfig();
    const { data: paymentMethods = [] } = useIndexPaymentMethods();
    const { data: customers = [] } = useCustomerList();
    const { mutateAsync: createLayaway, isPending } = useCreateLayaway();
    const promptReceipt = usePrintReceiptPrompt();
    const [isLayawayMode, setIsLayawayMode] = useState(false);

    const minPercent = config?.layaway_min_percent ?? DEFAULT_LAYAWAY_MIN_PERCENT;
    const days = config?.layaway_days ?? DEFAULT_LAYAWAY_DAYS;
    const minDeposit = calcMinDeposit(total, minPercent);
    const isAvailable = features?.is_retail === true && can("layaway") && orderId > 0 && total > 0 && !!sistemaId;
    const schema = useMemo(() => buildLayawaySchema(total, minDeposit), [total, minDeposit]);

    const formik = useFormik<LayawayForm>({
        initialValues: { customer_id: null, amount: "", payment_method_id: null },
        validationSchema: schema,
        onSubmit: async (values) => {
            if (!sistemaId || values.customer_id === null || values.payment_method_id === null) return;
            try {
                await createLayaway({
                    orderId,
                    data: {
                        customer_id: values.customer_id,
                        amount: Number(values.amount),
                        payment_method_id: values.payment_method_id,
                        sistema_id: sistemaId,
                    },
                });
                invalidateLayawayQueries(queryClient, { orderId, customerId: values.customer_id, sistemaId });
                toast.success("Apartado registrado correctamente");
                setIsLayawayMode(false);
                // El comprobante se ofrece antes de cerrar: onSuccess puede desmontar este flujo
                // (CartPanel navega al dashboard) y la impresión debe salir de un componente vivo.
                await promptReceipt(orderId);
                onSuccess();
            } catch (error) {
                logUnexpectedError(error, "useLayawayPay.submit");
                toast.error(getUserFacingErrorMessage(error, "Error al registrar el apartado"));
            }
        },
    });

    // Cerrar el modal de cobro sale del modo apartado — la próxima apertura vuelve al cobro normal.
    useEffect(() => {
        if (!isOpen) setIsLayawayMode(false);
    }, [isOpen]);

    const enter = () => {
        formik.resetForm({
            values: {
                customer_id: null,
                amount: String(minDeposit),
                payment_method_id: resolveDefaultPaymentMethodId(paymentMethods),
            },
        });
        setIsLayawayMode(true);
    };

    const setAmount = (value: string) => {
        formik.setFieldValue("amount", value);
        formik.setFieldTouched("amount", true, false);
    };

    const deposit = parseFloat(formik.values.amount) || 0;

    return {
        formik,
        isAvailable,
        isLayawayMode,
        isPending,
        enter,
        exit: () => setIsLayawayMode(false),
        setAmount,
        submit: formik.submitForm,
        canSubmit: isLayawayMode && !isPending && schema.isValidSync(formik.values),
        paymentMethods,
        customers,
        total,
        minPercent,
        deposit,
        balance: calcLayawayBalance(total, deposit),
        dueDate: computeLayawayDueDate(days),
    };
};
