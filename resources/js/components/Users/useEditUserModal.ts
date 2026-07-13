import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { useUpdateUser } from "@/services/useUserService";
import { IUser } from "@/models/IUser";
import { logUnexpectedError } from "@/plugins/logger.plugin";

const schema = Yup.object({
    nombre:           Yup.string().required("El nombre es requerido"),
    apellido_paterno: Yup.string().required("El apellido paterno es requerido"),
    apellido_materno: Yup.string().nullable(),
    email:            Yup.string().email("Email inválido").required("El email es requerido"),
    usuario:          Yup.string().required("El usuario es requerido"),
    rol_id:           Yup.number().required("El rol es requerido"),
    activo:           Yup.boolean().required(),
    password:         Yup.string().min(8, "Mínimo 8 caracteres").nullable(),
});

const buildInitialValues = (user: IUser | null) => ({
    nombre:           user?.nombre           ?? "",
    apellido_paterno: user?.apellido_paterno ?? "",
    apellido_materno: user?.apellido_materno ?? "",
    email:            user?.email            ?? "",
    usuario:          user?.usuario          ?? "",
    rol_id:           user?.rol_id           ?? 2,
    activo:           user ? Boolean(user.activo) : true,
    password:         "",
});

export const useEditUserModal = (user: IUser | null, onClose: () => void) => {
    const { mutateAsync, isPending } = useUpdateUser();

    const formik = useFormik({
        initialValues: buildInitialValues(user),
        validationSchema: schema,
        enableReinitialize: true,
        onSubmit: async (values, { setSubmitting }) => {
            if (!user) return;
            try {
                await mutateAsync({
                    id: user.id,
                    data: {
                        nombre:           values.nombre,
                        apellido_paterno: values.apellido_paterno,
                        apellido_materno: values.apellido_materno || undefined,
                        email:            values.email,
                        usuario:          values.usuario,
                        rol_id:           Number(values.rol_id),
                        activo:           values.activo,
                        password:         values.password || undefined,
                    },
                });
                toast.success("Usuario actualizado correctamente");
                onClose();
            } catch (error) {
                logUnexpectedError(error, "useEditUserModal.onSubmit");
                toast.error("No se pudo actualizar el usuario");
            } finally {
                setSubmitting(false);
            }
        },
    });

    return { formik, isPending };
};
