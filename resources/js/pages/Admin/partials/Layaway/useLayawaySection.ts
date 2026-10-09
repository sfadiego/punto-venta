import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { useUpdateBusinessConfig } from "@/services/useBusinessConfigService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { buildBusinessConfigPayload } from "@/utils/businessConfigPayload";
import {
    calcDepositFromPercent,
    DEFAULT_LAYAWAY_DAYS,
    DEFAULT_LAYAWAY_MIN_PERCENT,
    DEFAULT_LAYAWAY_RETENTION_PERCENT,
} from "@/utils/layawayCalc";

const schema = Yup.object({
    layaway_min_percent: Yup.number()
        .typeError("Ingresa un porcentaje válido")
        .required("Ingresa el anticipo mínimo")
        .min(1, "Debe ser al menos 1%")
        .max(100, "No puede pasar de 100%"),
    layaway_days: Yup.number()
        .typeError("Ingresa un plazo válido")
        .required("Ingresa el plazo")
        .integer("Debe ser un número entero de días")
        .min(1, "Debe ser al menos 1 día")
        .max(365, "No puede pasar de 365 días"),
    layaway_retention_percent: Yup.number()
        .typeError("Ingresa un porcentaje válido")
        .required("Ingresa el porcentaje")
        .min(0, "No puede ser negativo")
        .max(100, "No puede pasar de 100%"),
});

export interface LayawayFormValues {
    layaway_min_percent: number;
    layaway_days: number;
    layaway_retention_percent: number;
}

// Ejemplo del anticipo mínimo sobre una venta de este monto, mostrado bajo el campo de porcentaje.
export const LAYAWAY_EXAMPLE_TOTAL = 1000;

export const useLayawaySection = (config: IBusinessConfig | undefined) => {
    const updateMutation = useUpdateBusinessConfig();

    const formik = useFormik<LayawayFormValues>({
        enableReinitialize: true,
        initialValues: {
            layaway_min_percent: config?.layaway_min_percent ?? DEFAULT_LAYAWAY_MIN_PERCENT,
            layaway_days: config?.layaway_days ?? DEFAULT_LAYAWAY_DAYS,
            layaway_retention_percent: config?.layaway_retention_percent ?? DEFAULT_LAYAWAY_RETENTION_PERCENT,
        },
        validationSchema: schema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!config) return;
            try {
                await updateMutation.mutateAsync(
                    buildBusinessConfigPayload(config, {
                        layaway_min_percent: Number(values.layaway_min_percent),
                        layaway_days: Number(values.layaway_days),
                        layaway_retention_percent: Number(values.layaway_retention_percent),
                    }),
                );
                toast.success("Configuración de apartados guardada.");
            } catch (error) {
                logUnexpectedError(error, "useLayawaySection.onSubmit");
                toast.error(getUserFacingErrorMessage(error, "No se pudo guardar la configuración."));
            } finally {
                setSubmitting(false);
            }
        },
    });

    return {
        formik,
        exampleDeposit: calcDepositFromPercent(LAYAWAY_EXAMPLE_TOTAL, Number(formik.values.layaway_min_percent) || 0),
    };
};
