import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { useUpdateBusinessConfig } from "@/services/useBusinessConfigService";

const schema = Yup.object({
    phone:         Yup.string().nullable().max(30),
    address:       Yup.string().nullable().max(200),
    facebook:      Yup.string().nullable().max(100),
    instagram:     Yup.string().nullable().max(100),
    whatsapp:      Yup.string().nullable().max(30),
    website:       Yup.string().nullable().url("URL inválida").max(200),
    ticket_footer: Yup.string().nullable().max(100),
});

export const useBusinessInfoSection = (config: IBusinessConfig | undefined) => {
    const updateMutation = useUpdateBusinessConfig();

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            phone:         config?.phone         ?? "",
            address:       config?.address       ?? "",
            facebook:      config?.facebook      ?? "",
            instagram:     config?.instagram     ?? "",
            whatsapp:      config?.whatsapp      ?? "",
            website:       config?.website       ?? "",
            ticket_footer: config?.ticket_footer ?? "",
        },
        validationSchema: schema,
        onSubmit: async (values, { setSubmitting }) => {
            if (!config) return;
            try {
                await updateMutation.mutateAsync({
                    business_name: config.business_name,
                    primary_color: config.primary_color,
                    sidebar_color: config.sidebar_color,
                    font_color:    config.font_color,
                    label_color:   config.label_color,
                    phone:         values.phone    || null,
                    address:       values.address  || null,
                    facebook:      values.facebook || null,
                    instagram:     values.instagram || null,
                    whatsapp:      values.whatsapp || null,
                    website:       values.website  || null,
                    ticket_footer: values.ticket_footer || null,
                    printer_name:              config.printer_name,
                    printer_host:              config.printer_host,
                    logo_icon:                 config.logo_icon,
                    costo_domicilio_default:   config.costo_domicilio_default,
                    delivery_paid_by:          config.delivery_paid_by,
                });
                toast.success("Información actualizada correctamente.");
            } catch {
                toast.error("No se pudo guardar la información.");
            } finally {
                setSubmitting(false);
            }
        },
    });

    return { formik };
};
