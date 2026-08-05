import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { SalesReportModeEnum } from "@/enums/SalesReportModeEnum";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getFieldErrors, getUserFacingErrorMessage } from "@/utils/axiosError";
import { useModal } from "@/hooks/useModal";
import { useShowProvider } from "@/services/useProvidersService";
import { useProviderPurchases, useStoreProviderPurchase } from "@/services/useProviderPurchasesService";

export type ProviderPurchaseForm = {
    amount: string;
    note: string;
};

const purchaseSchema = Yup.object({
    amount: Yup.number()
        .typeError("Ingresa un monto válido")
        .required("Ingresa un monto")
        .min(0.01, "Debe ser mayor a 0"),
    note: Yup.string().max(500, "Máximo 500 caracteres"),
});

export const useProviderDetailPage = (providerId: number) => {
    const queryClient = useQueryClient();
    const { data: provider, isLoading } = useShowProvider(providerId);
    const { isOpen: isPurchaseModalOpen, openModal: openPurchaseModal, closeModal: closePurchaseModal } = useModal();

    const [reportMode, setReportMode] = useState<SalesReportModeEnum>(SalesReportModeEnum.Day);
    const [fecha, setFecha] = useState<string | null>(null);
    const [semana, setSemana] = useState<string | null>(null);
    const [mes, setMes] = useState<string | null>(null);

    const { data: purchases, isLoading: isLoadingPurchases } = useProviderPurchases(
        providerId,
        reportMode === SalesReportModeEnum.Day ? fecha : null,
        reportMode === SalesReportModeEnum.Month ? mes : null,
        reportMode === SalesReportModeEnum.Week ? semana : null,
    );

    const purchaseMutation = useStoreProviderPurchase(providerId);

    const invalidatePurchases = () => {
        queryClient.invalidateQueries({
            predicate: (query) =>
                typeof query.queryKey[0] === "string" &&
                query.queryKey[0].startsWith(`${ApiRoutes.Provider}/${providerId}`),
        });
    };

    const handleClearFilters = () => {
        setFecha(null);
        setSemana(null);
        setMes(null);
    };

    const purchaseFormik = useFormik<ProviderPurchaseForm>({
        initialValues: { amount: "", note: "" },
        validationSchema: purchaseSchema,
        onSubmit: async (values, helpers) => {
            try {
                await purchaseMutation.mutateAsync({
                    amount: Number(values.amount),
                    note: values.note.trim() || undefined,
                });
                invalidatePurchases();
                toast.success("Compra registrada correctamente");
                helpers.resetForm();
                closePurchaseModal();
            } catch (error) {
                const fieldErrors = getFieldErrors(error);

                if (fieldErrors) {
                    helpers.setErrors(fieldErrors);
                } else {
                    logUnexpectedError(error, "useProviderDetailPage.handleRegisterPurchase");
                    toast.error(getUserFacingErrorMessage(error, "No se pudo registrar la compra"));
                }
            }
        },
    });

    const handleClosePurchaseModal = () => {
        purchaseFormik.resetForm();
        closePurchaseModal();
    };

    return {
        provider,
        isLoading,
        purchases,
        isLoadingPurchases,
        purchaseFormik,
        isRegisteringPurchase: purchaseMutation.isPending,
        isPurchaseModalOpen,
        openPurchaseModal,
        closePurchaseModal: handleClosePurchaseModal,
        reportMode,
        setReportMode,
        fecha,
        setFecha,
        semana,
        setSemana,
        mes,
        setMes,
        handleClearFilters,
    };
};
