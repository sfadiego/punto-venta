import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { IUser } from "@/models/IUser";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { useLoginLockStatus, useUnblockLogin } from "@/services/useTenantUserService";

export const useUserRowActions = (tenantId: number, user: IUser) => {
    const { data: lockStatus } = useLoginLockStatus(tenantId, user.id);
    const unblockMutation = useUnblockLogin(tenantId);

    const handleUnblock = async () => {
        const result = await Swal.fire({
            title: "¿Desbloquear acceso?",
            text: `Se liberará el bloqueo por intentos fallidos de "${user.nombre} ${user.apellido_paterno}". Esto solo debería usarse en caso de emergencia — el bloqueo se libera automáticamente en menos de 1 minuto.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#f59e0b",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, desbloquear",
        });
        if (!result.isConfirmed) return;

        try {
            await unblockMutation.mutateAsync(user.id);
            toast.success("Acceso desbloqueado correctamente.");
        } catch (error) {
            logUnexpectedError(error, "useUserRowActions.handleUnblock");
            toast.error("No se pudo desbloquear el acceso.");
        }
    };

    return {
        isBlocked: lockStatus?.blocked ?? false,
        isUnblocking: unblockMutation.isPending,
        handleUnblock,
    };
};
