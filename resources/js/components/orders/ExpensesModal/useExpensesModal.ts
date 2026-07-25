import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useQueryClient } from "@tanstack/react-query";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { useModal } from "@/hooks/useModal";
import { useIndexExpenses, useStoreExpense } from "@/services/useExpenseService";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

export type ExpensesModalTab = "list" | "form";

export type RegisterExpenseForm = {
    concepto: string;
    monto: string;
    observaciones: string;
};

const schema = Yup.object({
    concepto: Yup.string().trim().required("El concepto es requerido").max(255, "Máximo 255 caracteres"),
    monto: Yup.number()
        .typeError("Ingresa un monto válido")
        .positive("El monto debe ser mayor a 0")
        .max(999999.99, "Monto demasiado alto")
        .required("El monto es requerido"),
    observaciones: Yup.string().max(500, "Máximo 500 caracteres"),
});

export const useExpensesModal = (sistemaId: number | null) => {
    const { isOpen, openModal, closeModal } = useModal();
    const [tab, setTab] = useState<ExpensesModalTab>("list");
    const queryClient = useQueryClient();

    const { data: expenses, isLoading: isLoadingExpenses } =
        useIndexExpenses(isOpen ? sistemaId : null);
    const { mutateAsync: storeExpense, isPending } = useStoreExpense(sistemaId ?? 0);

    const formik = useFormik<RegisterExpenseForm>({
        initialValues: { concepto: "", monto: "", observaciones: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            if (!sistemaId) return;
            try {
                await storeExpense({
                    concepto: values.concepto.trim(),
                    monto: Number(values.monto),
                    observaciones: values.observaciones.trim() || null,
                });
                queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.System}/${sistemaId}/expense`] });
                queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.System}/${sistemaId}/total-current-sales`] });
                toast.success("Gasto registrado exitosamente");
                helpers.resetForm();
                setTab("list");
            } catch (error) {
                logUnexpectedError(error, "useExpensesModal.onSubmit");
                toast.error(getUserFacingErrorMessage(error, "Error al registrar el gasto"));
            }
        },
    });

    const handleOpen = () => {
        setTab("list");
        openModal();
    };

    const handleClose = () => {
        formik.resetForm();
        setTab("list");
        closeModal();
    };

    return {
        isOpen,
        openModal: handleOpen,
        handleClose,
        tab,
        setTab,
        expenses: expenses ?? [],
        isLoadingExpenses,
        formik,
        isPending,
    };
};
