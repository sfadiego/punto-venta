import { useFormik } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import { IUser, ICreateUserPayload, IUpdateUserPayload } from "@/models/IUser";
import {
    useCreateTenantUser,
    useSyncTenantUserBranches,
    useTenantUserBranches,
    useUpdateTenantUser,
} from "@/services/useTenantUserService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
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
    const syncBranchesMutation = useSyncTenantUserBranches(tenantId);
    // Solo se consulta en edición — en alta no hay usuario todavía, branch_ids arranca []
    // y se envía junto con el POST de creación (ver TenantUserController::store).
    const { data: userBranches, isLoading: isLoadingBranches } = useTenantUserBranches(tenantId, user?.id ?? 0);

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
            branch_ids:       isEdit ? (userBranches?.branch_ids ?? []) : ([] as number[]),
        },
        validationSchema: schema(isEdit),
        onSubmit: async (values, { setSubmitting }) => {
            try {
                if (isEdit) {
                    const { branch_ids, ...rest } = values;
                    const payload: IUpdateUserPayload = { ...rest };
                    if (!payload.password) delete payload.password;
                    await updateMutation.mutateAsync({ id: user!.id, data: payload });

                    // Un Admin ya tiene acceso a todas las sucursales — sincronizar
                    // user_branch para uno sería un no-op rechazado por el backend.
                    if (Number(values.rol_id) !== RoleEnum.Admin) {
                        await syncBranchesMutation.mutateAsync({ userId: user!.id, branchIds: branch_ids });
                    }

                    toast.success("Usuario actualizado correctamente.");
                } else {
                    // branch_ids solo tiene efecto en el backend para roles distintos de
                    // Admin (ver TenantUserController::store) — se envía siempre, sin
                    // filtrar aquí, para no duplicar esa regla en dos lugares.
                    await createMutation.mutateAsync(values as ICreateUserPayload);
                    toast.success("Usuario creado correctamente.");
                }
                onClose();
            } catch (error) {

                logUnexpectedError(error, "useUserModal.onSubmit");
                toast.error(getUserFacingErrorMessage(error, "No se pudo guardar el usuario."));
            } finally {
                setSubmitting(false);
            }
        },
    });

    return { formik, isEdit, isLoadingBranches };
};
