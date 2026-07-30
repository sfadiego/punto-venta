import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { IUser } from "@/models/IUser";
import { useCreateSuperAdmin, useUpdateSuperAdmin } from "@/services/useSuperAdminUserService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

interface UseSuperAdminUserModalParams {
    user: IUser | null;
    onClose: () => void;
}

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()]{8,}$/;

const schema = (isEdit: boolean) =>
    Yup.object({
        nombre: Yup.string().required("Requerido").max(100, "Máximo 100 caracteres"),
        apellido_paterno: Yup.string().required("Requerido").max(100, "Máximo 100 caracteres"),
        apellido_materno: Yup.string().max(100, "Máximo 100 caracteres"),
        email: Yup.string().email("Correo inválido").required("Requerido"),
        usuario: Yup.string().required("Requerido").max(80, "Máximo 80 caracteres"),
        password: (isEdit ? Yup.string() : Yup.string().required("Requerido"))
            .min(8, "Mínimo 8 caracteres")
            .matches(passwordRegex, { message: "Debe incluir letras y números", excludeEmptyString: true }),
        password_confirmation: Yup.string().oneOf([Yup.ref("password")], "Las contraseñas no coinciden"),
    });

export const useSuperAdminUserModal = ({ user, onClose }: UseSuperAdminUserModalParams) => {
    const isEdit = !!user;
    const createMutation = useCreateSuperAdmin();
    const updateMutation = useUpdateSuperAdmin();

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            nombre: user?.nombre ?? "",
            apellido_paterno: user?.apellido_paterno ?? "",
            apellido_materno: user?.apellido_materno ?? "",
            email: user?.email ?? "",
            usuario: user?.usuario ?? "",
            password: "",
            password_confirmation: "",
        },
        validationSchema: schema(isEdit),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                if (isEdit) {
                    const payload = { ...values };
                    if (!payload.password) {
                        delete (payload as { password?: string }).password;
                        delete (payload as { password_confirmation?: string }).password_confirmation;
                    }
                    await updateMutation.mutateAsync({ id: user!.id, data: payload });
                    toast.success("Super administrador actualizado correctamente.");
                } else {
                    await createMutation.mutateAsync(values);
                    toast.success("Super administrador creado correctamente.");
                }
                onClose();
            } catch (error) {
                logUnexpectedError(error, "useSuperAdminUserModal.onSubmit");
                toast.error(getUserFacingErrorMessage(error, "No se pudo guardar el super administrador."));
            } finally {
                setSubmitting(false);
            }
        },
    });

    return { formik, isEdit };
};
