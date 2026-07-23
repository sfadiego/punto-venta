import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useAxios } from "@/hooks/useAxios";
import { useCreateDemoRequest } from "@/services/useDemoRequestService";
import { BusinessNicheEnum } from "@/enums/BusinessNicheEnum";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { isValidPhone, phoneValidationMessage } from "@/utils/phoneUtils";

export type DemoRequestForm = {
    business_name: string;
    email: string;
    phone: string;
    business_niche: BusinessNicheEnum | "";
};

const demoRequestSchema = Yup.object({
    business_name: Yup.string().required("El nombre del negocio es requerido"),
    email: Yup.string().email("Email inválido").required("El email es requerido"),
    phone: Yup.string()
        .required("El teléfono es requerido")
        .max(13, "El teléfono no puede tener más de 12 dígitos")
        .test("phone-valid", phoneValidationMessage, (v) => !v || isValidPhone(v)),
    business_niche: Yup.string().required("Selecciona el giro de tu negocio"),
});

export const useAuthPage = () => {
    const navigate = useNavigate();
    const { isAuth } = useAxios();
    const [slug, setSlug] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const { mutateAsync: createDemoRequest, isPending: isSubmittingDemo } = useCreateDemoRequest();

    useEffect(() => {
        localStorage.removeItem("tenantSlug");
    }, []);

    useEffect(() => {
        if (isAuth) {
            navigate("/", { replace: true });
            return;
        }
        const cached = localStorage.getItem("tenantSlug");
        if (cached) {
            navigate(`/${cached}/auth`, { replace: true });
        }
    }, [navigate, isAuth]);

    const goToClientAuth = (e: React.FormEvent) => {
        e.preventDefault();
        const value = slug.trim().toLowerCase();
        if (!value) return;
        navigate(`/${value}/auth`);
    };

    const demoFormik = useFormik<DemoRequestForm>({
        initialValues: {
            business_name: "",
            email: "",
            phone: "",
            business_niche: "",
        },
        validationSchema: demoRequestSchema,
        onSubmit: async (values, { resetForm }) => {
            try {
                await createDemoRequest({
                    business_name: values.business_name,
                    email: values.email,
                    phone: values.phone,
                    business_niche: values.business_niche as BusinessNicheEnum,
                });
                setSubmitted(true);
                resetForm();
            } catch (error) {
                logUnexpectedError(error, "useAuthPage.demoFormik.onSubmit");
                toast.error("No se pudo enviar la solicitud, intenta de nuevo");
            }
        },
    });

    return {
        slug,
        setSlug,
        goToClientAuth,
        demoFormik,
        isSubmittingDemo,
        submitted,
    };
};
