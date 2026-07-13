import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { IUser, ICreateUserPayload, IUpdateUserPayload } from "@/models/IUser";
import { useCreateTenantUser, useUpdateTenantUser } from "@/services/useTenantUserService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { RoleEnum } from "@/enums/RoleEnum";

interface UseUserModalParams {
    tenantId: number;
    tenantSlug: string;
    user: IUser | null;
    onClose: () => void;
}

const schema = (isEdit: boolean) =>
    Yup.object({
        nombre:           Yup.string().required("Requerido").max(100, "Máximo 100 caracteres"),
        apellido_paterno: Yup.string().required("Requerido").max(100, "Máximo 100 caracteres"),
        apellido_materno: Yup.string().max(100, "Máximo 100 caracteres"),
        email:            Yup.string().email("Correo inválido").required("Requerido"),
        usuario:          Yup.string().required("Requerido").max(80, "Máximo 80 caracteres"),
        password:         isEdit
            ? Yup.string().min(8, "Mínimo 8 caracteres")
            : Yup.string().min(8, "Mínimo 8 caracteres").required("Requerido"),
        rol_id:           Yup.number().required("Requerido"),
        activo:           Yup.boolean().required(),
    });

export const useUserModal = ({ tenantId, tenantSlug, user, onClose }: UseUserModalParams) => {
    const isEdit = !!user;
    const createMutation = useCreateTenantUser(tenantId);
    const updateMutation = useUpdateTenantUser(tenantId);

    const formik = useFormik({
        enableReinitialize: true,
        initialValues: {
            nombre:           user?.nombre ?? "",
            apellido_paterno: user?.apellido_paterno ?? "",
            apellido_materno: user?.apellido_materno ?? "",
            email:            user?.email ?? (tenantSlug ? `@${tenantSlug}.com` : ""),
            usuario:          user?.usuario ?? "",
            password:         "",
            rol_id:           user?.rol_id ?? RoleEnum.Employe,
            activo:           user ? Boolean(user.activo) : true,
        },
        validationSchema: schema(isEdit),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                if (isEdit) {
                    const payload: IUpdateUserPayload = { ...values };
                    if (!payload.password) delete payload.password;
                    await updateMutation.mutateAsync({ id: user!.id, data: payload });
                    toast.success("Usuario actualizado correctamente.");
                } else {
                    await createMutation.mutateAsync(values as ICreateUserPayload);
                    toast.success("Usuario creado correctamente.");
                }
                onClose();
            } catch (error) {

                logUnexpectedError(error, "useUserModal.onSubmit");
                toast.error("No se pudo guardar el usuario.");
            } finally {
                setSubmitting(false);
            }
        },
    });

    return { formik, isEdit };
};
