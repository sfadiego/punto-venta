import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
    useEnableTenantBranches,
    useListTenantBranches,
    useToggleTenantBranchActive,
} from "@/services/useTenantBranchService";
import { IBranch } from "@/models/IBranch";
import { getUserFacingErrorMessage } from "@/utils/axiosError";

export const useTenantBranchesSection = (tenantId: number) => {
    const { data: branches, isLoading } = useListTenantBranches(tenantId);
    const { mutate: enable, isPending: enabling } = useEnableTenantBranches(tenantId);
    const { mutate: toggleActive } = useToggleTenantBranchActive(tenantId);

    // La activación crea la sucursal "Principal" y hace backfill de productos/cajas
    // existentes sin sucursal — se confirma antes porque no es una acción trivial de
    // deshacer (ver BranchActivationService en el backend).
    const handleEnable = async () => {
        const result = await Swal.fire({
            title: "¿Activar sucursales?",
            text: "Se creará una sucursal \"Principal\" y se le asignarán los productos y cajas existentes que aún no tengan sucursal. Después podrás agregar las sucursales reales del negocio.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Sí, activar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        enable(undefined, {
            onSuccess: () => toast.success("Sucursales activadas correctamente"),
            onError: (error) => toast.error(getUserFacingErrorMessage(error, "Error al activar sucursales")),
        });
    };

    // Confirmación antes de alternar: desactivar una sucursal le quita acceso a los
    // usuarios asignados y la oculta de los selectores (apertura de caja, producto).
    const handleToggleActive = async (branch: IBranch) => {
        const activating = !branch.active;

        const result = await Swal.fire({
            title: activating ? `¿Activar "${branch.name}"?` : `¿Desactivar "${branch.name}"?`,
            text: activating
                ? "Volverá a estar disponible en los selectores de sucursal."
                : "Dejará de estar disponible para abrir caja o asignarse a productos nuevos.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: activating ? "Sí, activar" : "Sí, desactivar",
            cancelButtonText: "Cancelar",
        });

        if (!result.isConfirmed) return;

        toggleActive(branch.id, {
            onSuccess: () => toast.success(activating ? "Sucursal activada" : "Sucursal desactivada"),
            onError: (error) => toast.error(getUserFacingErrorMessage(error, "Error al actualizar la sucursal")),
        });
    };

    return { branches, isLoading, handleEnable, enabling, handleToggleActive };
};
