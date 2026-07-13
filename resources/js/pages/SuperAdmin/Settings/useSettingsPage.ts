import { useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useGetAppSettings, useUpdateAppSettings, IPaymentInfo } from "@/services/useAppSettingService";

const paymentSchema = Yup.object({
    bank:    Yup.string().required("Requerido"),
    account: Yup.string().required("Requerido"),
    holder:  Yup.string().required("Requerido"),
    concept: Yup.string(),
});

const defaultPayment = (info?: IPaymentInfo | null) => ({
    bank:    info?.bank    ?? "",
    account: info?.account ?? "",
    holder:  info?.holder  ?? "",
    concept: info?.concept ?? "",
});

export const useSettingsPage = () => {
    const { data: settings, isLoading } = useGetAppSettings();
    const { mutate: update, isPending: saving } = useUpdateAppSettings();

    const toggleLogoUpload = () => {
        update(
            { logo_upload_enabled: !settings?.logo_upload_enabled },
            {
                onSuccess: () => toast.success("Configuración guardada"),
                onError: () => toast.error("Error al guardar"),
            }
        );
    };

    const paymentFormik = useFormik({
        initialValues: defaultPayment(settings?.payment_info),
        validationSchema: paymentSchema,
        enableReinitialize: false,
        onSubmit: (values, { setSubmitting }) => {
            update(
                { payment_info: values },
                {
                    onSuccess: () => toast.success("Datos de pago guardados"),
                    onError:   () => toast.error("Error al guardar"),
                    onSettled: () => setSubmitting(false),
                }
            );
        },
    });

    useEffect(() => {
        if (settings?.payment_info) {
            paymentFormik.resetForm({ values: defaultPayment(settings.payment_info) });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings?.payment_info?.account]);

    return { settings, isLoading, saving, toggleLogoUpload, paymentFormik };
};
