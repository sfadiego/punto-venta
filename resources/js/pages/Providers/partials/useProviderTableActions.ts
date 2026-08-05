import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { IProvider } from "@/models/IProvider";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { RoleEnum } from "@/enums/RoleEnum";
import { useDeleteProvider, useToggleProviderActive } from "@/services/useProvidersService";
import { usePermissions } from "@/hooks/usePermissions";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

export const useProviderTableActions = (provider: IProvider) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { hasRole } = usePermissions();
    const isAdmin = hasRole(RoleEnum.Admin);
    const { mutateAsync: deleteProvider, isPending: isDeleting } = useDeleteProvider(provider.id);
    const { mutateAsync: toggleActive, isPending: isToggling } = useToggleProviderActive(provider.id);

    const invalidateProviders = () => {
        queryClient.invalidateQueries({ queryKey: [ApiRoutes.Provider] });
        queryClient.invalidateQueries({ queryKey: [`${ApiRoutes.Provider}/list`] });
    };

    const goToDetail = () => {
        navigate(AdminRoutes.ProviderDetail.replace(":id", String(provider.id)));
    };

    const handleToggleActive = async () => {
        try {
            await toggleActive({});
            invalidateProviders();
            toast.success(provider.active ? "Proveedor ocultado" : "Proveedor visible nuevamente");
        } catch (error) {
            logUnexpectedError(error, "useProviderTableActions.handleToggleActive");
            toast.error(getUserFacingErrorMessage(error, "No se pudo actualizar el proveedor"));
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: "¿Eliminar proveedor?",
            text: `"${provider.name}" se eliminará. Su historial de compras se conserva.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#78716c",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, eliminar",
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        await deleteProvider({});
        invalidateProviders();
        toast.success("Proveedor eliminado");
    };

    return {
        isAdmin,
        isDeleting,
        isToggling,
        goToDetail,
        handleToggleActive,
        handleDelete,
    };
};
