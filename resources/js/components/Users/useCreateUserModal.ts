import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { RoleEnum } from "@/enums/RoleEnum";
import { useCreateUser } from "@/services/useUserService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

const schema = Yup.object({
    nombre:           Yup.string().required("El nombre es requerido"),
    apellido_paterno: Yup.string().required("El apellido paterno es requerido"),
    apellido_materno: Yup.string().nullable(),
    email:            Yup.string().email("Email inválido").required("El email es requerido"),
    usuario:          Yup.string().required("El usuario es requerido"),
    rol_id:           Yup.number().required("El rol es requerido"),
    activo:           Yup.boolean().required(),
    password:         Yup.string().min(8, "Mínimo 8 caracteres").required("La contraseña es requerida"),
});

const initialValues = {
    nombre: "",
    apellido_paterno: "",
    apellido_materno: "",
    email: "",
    usuario: "",
    rol_id: RoleEnum.Employe,
    activo: true,
    password: "",
};

export const useCreateUserModal = (onClose: () => void) => {
    const { mutateAsync, isPending } = useCreateUser();

    const formik = useFormik({
        initialValues,
        validationSchema: schema,
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            try {
                await mutateAsync({
                    nombre:           values.nombre,
                    apellido_paterno: values.apellido_paterno,
                    apellido_materno: values.apellido_materno || undefined,
                    email:            values.email,
                    usuario:          values.usuario,
                    rol_id:           Number(values.rol_id),
                    activo:           values.activo,
                    password:         values.password,
                });

                toast.success("Usuario creado correctamente");
                resetForm();
                onClose();
            } catch (error) {
                logUnexpectedError(error, "useCreateUserModal.onSubmit");
                toast.error(getUserFacingErrorMessage(error, "No se pudo crear el usuario"));
            } finally {
                setSubmitting(false);
            }
        },
    });

    return { formik, isPending };
};
