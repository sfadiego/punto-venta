import { useFormik, FormikProps } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useCreateTenant, useUpdateTenant, useListTenants } from "@/services/useSuperAdminService";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";
import { BusinessTypeEnum } from "@/enums/BusinessTypeEnum";
import { logUnexpectedError } from "@/plugins/logger.plugin";

export interface TenantFormValues {
    slug: string;
    business_name: string;
    primary_color: string;
    sidebar_color: string;
    font_color: string;
    label_color: string;
    logo_icon: string;
    tipo_negocio: BusinessTypeEnum;
    printer_enabled: boolean;
    bluetooth_printing_enabled: boolean;
    max_users: number | null;
    subscription_amount: number | null;
    admin_nombre: string;
    admin_apellido: string;
    admin_email: string;
    admin_usuario: string;
    admin_password: string;
}

export type TenantFormik = FormikProps<TenantFormValues>;

const COLOR_DEFAULTS = {
    primary_color: "#F59E0B",
    sidebar_color: "#1C1917",
    font_color:    "#FFFFFF",
    label_color:   "#1C1917",
};

const baseSchema = {
    slug:          Yup.string().required("Requerido").matches(/^[a-z0-9-]+$/, "Solo letras, números y guiones").max(255, "Máximo 255 caracteres"),
    business_name: Yup.string().required("Requerido").max(100, "Máximo 100 caracteres"),
    primary_color: Yup.string().required("Requerido"),
    sidebar_color: Yup.string().required("Requerido"),
    font_color:    Yup.string().required("Requerido"),
    label_color:   Yup.string().required("Requerido"),
    tipo_negocio:  Yup.string().oneOf(Object.values(BusinessTypeEnum)).required("Requerido"),
    max_users:     Yup.number().nullable().min(1, "Mínimo 1").max(999, "Máximo 999"),
    subscription_amount: Yup.number().nullable().min(0, "No puede ser negativo"),
};

const createSchema = Yup.object({
    ...baseSchema,
    admin_nombre:   Yup.string().required("Requerido").max(100, "Máximo 100 caracteres"),
    admin_apellido: Yup.string().required("Requerido").max(100, "Máximo 100 caracteres"),
    admin_email:    Yup.string().email("Email inválido").required("Requerido"),
    admin_usuario:  Yup.string().required("Requerido").max(255, "Máximo 255 caracteres"),
    admin_password: Yup.string().min(6, "Mínimo 6 caracteres").required("Requerido"),
});

const editSchema = Yup.object(baseSchema);

export const useTenantForm = (tenantId?: number) => {
    const navigate = useNavigate();
    const isEdit = !!tenantId;

    const { data: tenants = [] } = useListTenants();
    const tenant = tenants.find((t) => t.id === tenantId);

    const createMutation = useCreateTenant();
    const updateMutation = useUpdateTenant();

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            slug:             tenant?.slug ?? "",
            business_name:    tenant?.business_name ?? "",
            primary_color:    tenant?.primary_color ?? COLOR_DEFAULTS.primary_color,
            sidebar_color:    tenant?.sidebar_color ?? COLOR_DEFAULTS.sidebar_color,
            font_color:       tenant?.font_color ?? COLOR_DEFAULTS.font_color,
            label_color:      tenant?.label_color ?? COLOR_DEFAULTS.label_color,
            logo_icon:        tenant?.logo_icon ?? "",
            tipo_negocio:     tenant?.tipo_negocio ?? BusinessTypeEnum.Restaurante,
            printer_enabled:  tenant?.printer_enabled ?? false,
            bluetooth_printing_enabled: tenant?.bluetooth_printing_enabled ?? false,
            max_users:        tenant?.max_users ?? null,
            subscription_amount: tenant?.subscription_amount ?? null,
            admin_nombre:     "",
            admin_apellido:   "",
            admin_email:      "",
            admin_usuario:    "",
            admin_password:   "",
        },
        validationSchema: isEdit ? editSchema : createSchema,
        onSubmit: async (values, helpers) => {
            try {
                if (isEdit) {
                    await updateMutation.mutateAsync({
                        id: tenantId,
                        data: {
                            ...values,
                            logo_icon:       values.logo_icon || null,
                            printer_enabled: values.printer_enabled,
                            max_users:       values.max_users ? Number(values.max_users) : null,
                            subscription_amount: values.subscription_amount !== null ? Number(values.subscription_amount) : null,
                        },
                    });
                    toast.success("Cliente actualizado.");
                } else {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    await createMutation.mutateAsync(values as any);
                    toast.success("Cliente creado correctamente.");
                }
                navigate(SuperAdminRoutes.Tenants);
            } catch (err: unknown) {
                logUnexpectedError(err, "useTenantForm.onSubmit");
                const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Error al guardar.";
                toast.error(msg);
                helpers.setSubmitting(false);
            }
        },
    });

    const handleResetColors = () => {
        const { primary_color, sidebar_color, font_color, label_color } = formik.values;
        const alreadyDefault =
            primary_color === COLOR_DEFAULTS.primary_color &&
            sidebar_color === COLOR_DEFAULTS.sidebar_color &&
            font_color.toUpperCase()    === COLOR_DEFAULTS.font_color &&
            label_color.toUpperCase()   === COLOR_DEFAULTS.label_color;

        if (alreadyDefault) {
            toast.info("Los colores ya son los valores por defecto");
            return;
        }

        formik.setFieldValue("primary_color", COLOR_DEFAULTS.primary_color);
        formik.setFieldValue("sidebar_color", COLOR_DEFAULTS.sidebar_color);
        formik.setFieldValue("font_color",    COLOR_DEFAULTS.font_color);
        formik.setFieldValue("label_color",   COLOR_DEFAULTS.label_color);
    };

    return { formik, isEdit, tenant, handleResetColors };
};
