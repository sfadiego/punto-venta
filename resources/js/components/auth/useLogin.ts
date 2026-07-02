import { useAxios } from "@/hooks/useAxios";
import * as Yup from "yup";
import { ISignInForm } from "@/intefaces/IAuth";
import { useServiceLogin } from "@/services/auth/useServiceAuth";
import { useFormik } from "formik";
import axios from "axios";
import { toast } from "react-toastify";

const validationSchema = Yup.object<ISignInForm>({
    email: Yup.string()
        .email("Ingresa un correo válido")
        .required("El correo es requerido"),
    password: Yup.string()
        .min(6, "Mínimo 6 caracteres")
        .required("La contraseña es requerida"),
});

const initialValues: ISignInForm = { email: "", password: "" };

export const useLogin = () => {
    const { saveAuth } = useAxios();
    const loginMutation = useServiceLogin();

    const formik = useFormik<ISignInForm>({
        initialValues,
        validationSchema,
        onSubmit: async (values) => {
            try {
                const slug = localStorage.getItem("tenantSlug") ?? undefined;
                const { access_token, user, features } = await loginMutation.mutateAsync({ ...values, slug });
                saveAuth(access_token, user, features);
                window.location.replace("/");
            } catch (error) {
                if (axios.isAxiosError(error)) {
                    const msg =
                        error.response?.data?.message ?? "Credenciales incorrectas";
                    toast.error(msg);
                } else {
                    toast.error("Error al iniciar sesion");
                }
            }
        },
    });

    return { formik, loginMutation };
};
