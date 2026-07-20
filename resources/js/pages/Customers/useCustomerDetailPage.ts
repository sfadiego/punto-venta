import { useFormik } from "formik";
import * as Yup from "yup";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import {
    useShowCustomer,
    useToggleCustomerCredit,
    useRegisterCustomerPayment,
} from "@/services/useCustomerService";

export type PaymentForm = {
    amount: string;
    note: string;
};

type ApiError = { response?: { data?: { data?: Record<string, string[] | string>; message?: string } } };

const paymentSchema = Yup.object({
    amount: Yup.number()
        .typeError("Ingresa un monto válido")
        .required("Ingresa un monto")
        .min(0.01, "Debe ser mayor a 0"),
    note: Yup.string().max(500, "Máximo 500 caracteres"),
});

export const useCustomerDetailPage = (customerId: number) => {
    const queryClient = useQueryClient();
    const { data: customer, isLoading } = useShowCustomer(customerId);
    const toggleCreditMutation = useToggleCustomerCredit(customerId);
    const paymentMutation = useRegisterCustomerPayment(customerId);

    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Customer}/${customerId}`] });
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Customer] });
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Customer}/list`] });
    };

    const handleToggleCredit = async () => {
        if (!customer) return;

        if (customer.allow_credit) {
            const result = await Swal.fire({
                title: "¿Revocar crédito a este cliente?",
                text: "Podrá seguir pagando en efectivo, pero no se le podrá fiar de nuevo hasta reactivarlo.",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#ef4444",
                cancelButtonColor: "#78716c",
                cancelButtonText: "Cancelar",
                confirmButtonText: "Sí, revocar",
                reverseButtons: true,
            });
            if (!result.isConfirmed) return;
        }

        try {
            await toggleCreditMutation.mutateAsync({});
            invalidate();
            toast.success(customer.allow_credit ? "Crédito revocado" : "Crédito habilitado");
        } catch (error) {
            logUnexpectedError(error, "useCustomerDetailPage.handleToggleCredit");
            toast.error("No se pudo actualizar el crédito del cliente");
        }
    };

    const paymentFormik = useFormik<PaymentForm>({
        initialValues: { amount: "", note: "" },
        validationSchema: paymentSchema,
        onSubmit: async (values, helpers) => {
            try {
                await paymentMutation.mutateAsync({
                    amount: Number(values.amount),
                    note: values.note.trim() || undefined,
                });
                invalidate();
                toast.success("Pago registrado correctamente");
                helpers.resetForm();
            } catch (error) {
                const apiError = error as ApiError;
                const fieldErrors = apiError.response?.data?.data;

                if (fieldErrors) {
                    const errors: Record<string, string> = {};
                    Object.entries(fieldErrors).forEach(([field, message]) => {
                        errors[field] = Array.isArray(message) ? message[0] : String(message);
                    });
                    helpers.setErrors(errors);
                } else {
                    logUnexpectedError(error, "useCustomerDetailPage.handleRegisterPayment");
                    toast.error(apiError.response?.data?.message ?? "No se pudo registrar el pago");
                }
            }
        },
    });

    const handleLiquidarTodo = () => {
        if (!customer) return;
        paymentFormik.setFieldValue("amount", String(customer.balance));
    };

    return {
        customer,
        isLoading,
        paymentFormik,
        handleLiquidarTodo,
        isPaying: paymentMutation.isPending,
        handleToggleCredit,
        isTogglingCredit: toggleCreditMutation.isPending,
    };
};
