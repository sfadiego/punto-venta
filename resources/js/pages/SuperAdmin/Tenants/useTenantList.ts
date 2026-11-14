import { useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
    useListTenants,
    useListTenantsPaginated,
    useDeleteTenant,
    useToggleTenant,
    useRestoreTenant,
} from "@/services/useSuperAdminService";
import { TenantStatusEnum } from "@/enums/TenantStatusEnum";
import { TenantDemoFilterEnum } from "@/enums/TenantDemoFilterEnum";
import { filterToFlags } from "@/utils/tenantFilters";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { ITenant } from "@/models/ITenant";
import { useServerTable } from "@/hooks/useServerTable";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

// Límite generoso para los widgets de resumen (usuarios activos / sin actividad reciente) —
// necesitan ver TODOS los tenants elegibles para sumar bien, no solo la página actual de la
// tabla. El total real de tenants en este sistema es pequeño (decenas, no miles).
const WIDGETS_LIMIT = 200;

export const useTenantList = () => {
    const [status, setStatus] = useState<TenantStatusEnum>(TenantStatusEnum.All);
    const [demoFilter, setDemoFilter] = useState<TenantDemoFilterEnum>(TenantDemoFilterEnum.All);
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebouncedValue(search);

    const { tableProps, refetch, isRefetching } = useServerTable({
        service: useListTenantsPaginated,
        params: {
            status,
            ...filterToFlags(demoFilter),
            search: debouncedSearch || undefined,
        },
    });

    // Fuente independiente de la tabla — ver comentario de WIDGETS_LIMIT arriba.
    const { data: allTenants = [] } = useListTenants(TenantStatusEnum.All, 30_000, undefined, WIDGETS_LIMIT);

    const deleteMutation = useDeleteTenant();
    const toggleMutation = useToggleTenant();
    const restoreMutation = useRestoreTenant();

    const handleToggle = async (tenant: ITenant) => {
        const action = tenant.activo ? "desactivar" : "activar";
        const result = await Swal.fire({
            title: `¿${tenant.activo ? "Desactivar" : "Activar"} cliente?`,
            text: tenant.activo
                ? `"${tenant.business_name}" no podrá acceder al sistema.`
                : `"${tenant.business_name}" recuperará el acceso al sistema.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: tenant.activo ? "#f59e0b" : "#22c55e",
            cancelButtonText: "Cancelar",
            confirmButtonText: `Sí, ${action}`,
        });
        if (!result.isConfirmed) return;
        try {
            await toggleMutation.mutateAsync(tenant.id);
            toast.success(`Cliente ${action === "activar" ? "activado" : "desactivado"} correctamente.`);
        } catch (error) {
            logUnexpectedError(error, "useTenantList.handleToggle");
            toast.error(getUserFacingErrorMessage(error, `No se pudo ${action} el cliente.`));
        }
    };

    const handleRestore = async (tenant: ITenant) => {
        const result = await Swal.fire({
            title: "¿Restaurar cliente?",
            text: `"${tenant.business_name}" volverá a estar disponible en el sistema.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#6366f1",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, restaurar",
        });
        if (!result.isConfirmed) return;
        try {
            await restoreMutation.mutateAsync(tenant.id);
            toast.success("Cliente restaurado correctamente.");
        } catch (error) {
            logUnexpectedError(error, "useTenantList.handleRestore");
            toast.error(getUserFacingErrorMessage(error, "No se pudo restaurar el cliente."));
        }
    };

    const handleDelete = async (tenant: ITenant) => {
        const result = await Swal.fire({
            title: "¿Eliminar cliente?",
            text: `Se eliminará "${tenant.business_name}" y todos sus datos.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonText: "Cancelar",
            confirmButtonText: "Sí, eliminar",
        });
        if (!result.isConfirmed) return;
        try {
            await deleteMutation.mutateAsync(tenant.id);
            toast.success("Cliente eliminado correctamente.");
        } catch (error) {
            logUnexpectedError(error, "useTenantList.handleDelete");
            toast.error(getUserFacingErrorMessage(error, "No se pudo eliminar el cliente."));
        }
    };

    return {
        tableProps,
        allTenants,
        isRefetching,
        refetch,
        status,
        setStatus,
        demoFilter,
        setDemoFilter,
        search,
        setSearch,
        handleToggle,
        handleRestore,
        handleDelete,
    };
};
