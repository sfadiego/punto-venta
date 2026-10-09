import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { useUpdateBusinessConfig } from "@/services/useBusinessConfigService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { buildBusinessConfigPayload } from "@/utils/businessConfigPayload";

const schema = Yup.object({
    return_days: Yup.number()
        .typeError("Ingresa un plazo válido")
        .required("Ingresa el plazo (0 = sin límite)")
        .integer("Debe ser un número entero de días")
        .min(0, "No puede ser negativo")
        .max(365, "No puede pasar de 365 días"),
});

// Política por defecto (la misma que la migración de business_config): devolver solo en los primeros días.
export const DEFAULT_RETURN_DAYS = 10;

export interface ReturnsFormValues {
    return_days: number;
}

export const useReturnsSection = (config: IBusinessConfig | undefined) => {
    const updateMutation = useUpdateBusinessConfig();

    const formik = useFormik<ReturnsFormValues>({
        enableReinitialize: true,
        initialValues: { return_days: config?.return_days ?? DEFAULT_RETURN_DAYS },
        validationSchema: schema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!config) return;
            try {
                await updateMutation.mutateAsync(buildBusinessConfigPayload(config, { return_days: Number(values.return_days) }));
                toast.success("Configuración de devoluciones guardada.");
            } catch (error) {
                logUnexpectedError(error, "useReturnsSection.onSubmit");
                toast.error(getUserFacingErrorMessage(error, "No se pudo guardar la configuración."));
            } finally {
                setSubmitting(false);
            }
        },
    });

    return { formik };
};
