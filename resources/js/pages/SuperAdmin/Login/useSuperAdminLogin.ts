import { useFormik } from "formik";
import * as Yup from "yup";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { superAdminAuth } from "@/contexts/SuperAdminContext";
import { SuperAdminRoutes } from "@/enums/RoutesEnum";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

const schema = Yup.object({
    email:    Yup.string().email("Email inválido").required("Requerido"),
    password: Yup.string().required("Requerido"),
});

export const useSuperAdminLogin = () => {
    const navigate = useNavigate();

    const formik = useFormik({
        initialValues: { email: "", password: "" },
        validationSchema: schema,
        onSubmit: async (values, helpers) => {
            try {
                await superAdminAuth.login(values.email, values.password);
                navigate(SuperAdminRoutes.Tenants, { replace: true });
            } catch (error) {
                toast.error(getUserFacingErrorMessage(error, "Credenciales inválidas o sin permisos de super administrador."));
                helpers.setSubmitting(false);
            }
        },
    });

    return { formik };
};
