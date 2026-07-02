import { useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { IUser } from "@/models/IUser";
import { useListTenantUsers, useDeleteTenantUser } from "@/services/useTenantUserService";
import { useListTenants } from "@/services/useSuperAdminService";
import { BusinessTypeEnum } from "@/enums/BusinessTypeEnum";

export const useTenantUsers = (tenantId: number) => {
    const { data: users = [], isLoading } = useListTenantUsers(tenantId);
    const { data: tenants = [] } = useListTenants();
    const tenant = tenants.find((t) => t.id === tenantId);
    const tenantSlug = tenant?.slug ?? "";
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
        } catch {
            toast.error("No se pudo eliminar el usuario.");
        }
    };

    return {
        users,
        isLoading,
        tenantSlug,
        tipoNegocio,
        modalUser,
        isModalOpen: modalUser !== undefined,
        openCreate,
        openEdit,
        closeModal,
        handleDelete,
    };
};
