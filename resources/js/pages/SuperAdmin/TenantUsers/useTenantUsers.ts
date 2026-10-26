import { useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { IUser } from "@/models/IUser";
import { useListTenantUsers, useDeleteTenantUser } from "@/services/useTenantUserService";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { useGetTenant } from "@/services/useSuperAdminService";
import { BusinessTypeEnum } from "@/enums/BusinessTypeEnum";

export const useTenantUsers = (tenantId: number) => {
    const { data: users = [], isLoading, isFetching } = useListTenantUsers(tenantId);
    const { data: tenant } = useGetTenant(tenantId);
    const tenantSlug = tenant?.slug ?? "";
    // Un cliente desactivado no admite cambios en sus usuarios hasta que se reactive.
    const isTenantInactive = tenant?.activo === false;
    const tipoNegocio = tenant?.tipo_negocio ?? BusinessTypeEnum.Restaurante;
    const deleteMutation = useDeleteTenantUser(tenantId);

    const [modalUser, setModalUser] = useState<IUser | null | undefined>(undefined);

    const openCreate = () => setModalUser(null);
    const openEdit = (user: IUser) => setModalUser(user);
    const closeModal = () => setModalUser(undefined);

    const handleDelete = async (user: IUser) => {
        const result = await Swal.fire({
            title: "¿Eliminar usuario?",
            text: `Se eliminará "${user.nombre} ${user.apellido_paterno}" permanentemente.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, eliminar",
        });
        if (!result.isConfirmed) return;
        try {
            await deleteMutation.mutateAsync(user.id);
            toast.success("Usuario eliminado correctamente.");
        } catch (error) {
            logUnexpectedError(error, "useTenantUsers.handleDelete");
            toast.error(getUserFacingErrorMessage(error, "No se pudo eliminar el usuario."));
        }
    };

    return {
        users,
        isLoading,
        isFetching,
        tenantSlug,
        tipoNegocio,
        isTenantInactive,
        modalUser,
        isModalOpen: modalUser !== undefined,
        openCreate,
        openEdit,
        closeModal,
        handleDelete,
    };
};
