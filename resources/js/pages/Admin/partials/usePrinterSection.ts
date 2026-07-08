import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { useUpdateBusinessConfig } from "@/services/useBusinessConfigService";

const schema = Yup.object({
    printer_name: Yup.string().nullable().max(100),
    printer_host: Yup.string().nullable().max(100),
});

export const usePrinterSection = (config: IBusinessConfig | undefined) => {
    const updateMutation = useUpdateBusinessConfig();

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            printer_name: config?.printer_name ?? "",
            printer_host: config?.printer_host ?? "",
        },
        validationSchema: schema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!config) return;
            try {
                await updateMutation.mutateAsync({
                    business_name:  config.business_name,
                    primary_color:  config.primary_color,
                    sidebar_color:  config.sidebar_color,
                    font_color:     config.font_color,
                    label_color:    config.label_color,
                    phone:          config.phone,
                    address:        config.address,
                    facebook:       config.facebook,
                    instagram:      config.instagram,
                    whatsapp:       config.whatsapp,
                    website:        config.website,
                    ticket_footer:  config.ticket_footer,
                    logo_icon:                config.logo_icon,
                    printer_name:             values.printer_name || null,
                    printer_host:             values.printer_host || null,
                    costo_domicilio_default:  config.costo_domicilio_default,
                });
                toast.success("Configuración de impresora guardada.");
            } catch {
                toast.error("No se pudo guardar la configuración.");
            } finally {
                setSubmitting(false);
            }
        },
    });

    return { formik };
};
