import { useState } from "react";
import { useAxios } from "@/hooks/useAxios";
import * as Yup from "yup";
import { ISignInForm } from "@/intefaces/IAuth";
import { useServiceLogin } from "@/services/auth/useServiceAuth";
import { useFormik } from "formik";
import { isAxiosError, getUserFacingErrorMessage } from "@/utils/axiosError";
import { ApiErrorCodeEnum } from "@/enums/ApiErrorCodeEnum";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { toast } from "react-toastify";
import { ISubscriptionExpiredInfo } from "@/models/ISubscription";

const validationSchema = Yup.object<ISignInForm>({
    email: Yup.string()
        .email("Ingresa un correo válido")
        .required("El correo es requerido"),
    password: Yup.string()
        .min(6, "Mínimo 6 caracteres")
        .required("La contraseña es requerida"),
});

const initialValues: ISignInForm = { email: "", password: "" };

export const useAuth = () => {
    const { saveAuth } = useAxios();
    const loginMutation = useServiceLogin();
    // Sin sucursal asignada es un caso accionable ("contacta a tu administrador"), no un
    // error transitorio de credenciales — se muestra fijo arriba del formulario en vez de
    // un toast que desaparece solo.
    const [banner, setBanner] = useState<string | null>(null);
    // Suscripción vencida trae además los datos de pago (ver AuthService::login) — el toast
    // ya avisa del bloqueo; esto solo habilita el badge debajo del form que abre el modal con
    // el detalle (reutiliza PaymentInfoCard/RenewalCard de SubscriptionPage).
    const [subscriptionExpired, setSubscriptionExpired] = useState<ISubscriptionExpiredInfo | null>(null);

    const formik = useFormik<ISignInForm>({
        initialValues,
        validationSchema,
        onSubmit: async (values) => {
            setBanner(null);
            setSubscriptionExpired(null);
            try {
                const slug = localStorage.getItem("tenantSlug") ?? undefined;
                const { access_token, user, features, role_permissions, tenant_slug } = await loginMutation.mutateAsync({ ...values, slug });
                saveAuth(access_token, user, features, role_permissions, tenant_slug);
                window.location.replace("/");
            } catch (error) {
                if (isAxiosError(error)) {
                    const code = error.response?.data?.data?.code;

                    if (code === ApiErrorCodeEnum.NoBranchAssigned) {
                        setBanner(getUserFacingErrorMessage(error, "Tu usuario no tiene ninguna sucursal asignada."));
                    } else if (code === ApiErrorCodeEnum.SubscriptionExpired) {
                        toast.error(getUserFacingErrorMessage(error, "La suscripción de este negocio ha vencido."));
                        setSubscriptionExpired(error.response?.data?.data as ISubscriptionExpiredInfo);
                    } else {
                        toast.error(getUserFacingErrorMessage(error, "Credenciales incorrectas"));
                    }
                } else {
                    logUnexpectedError(error, "useAuth.login");
                    toast.error("Error al iniciar sesion");
                }
            }
        },
    });

    return { formik, loginMutation, banner, subscriptionExpired };
};
