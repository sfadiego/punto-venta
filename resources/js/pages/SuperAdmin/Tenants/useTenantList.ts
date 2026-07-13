import { useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
    useListTenants,
    useDeleteTenant,
    useToggleTenant,
    useRestoreTenant,
} from "@/services/useSuperAdminService";
import { TenantStatusEnum } from "@/enums/TenantStatusEnum";
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { ITenant } from "@/models/ITenant";

export const useTenantList = () => {
    const [status, setStatus] = useState<TenantStatusEnum>(TenantStatusEnum.All);
    const [search, setSearch] = useState("");

    const { data: tenants = [], isLoading, refetch, isRefetching } = useListTenants(status, 30_000);
    const deleteMutation = useDeleteTenant();
    const toggleMutation = useToggleTenant();
    const restoreMutation = useRestoreTenant();

    const filtered = tenants.filter((t) =>
        t.business_name.toLowerCase().includes(search.toLowerCase()) ||
        t.slug.toLowerCase().includes(search.toLowerCase())
    );

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
            toast.error(`No se pudo ${action} el cliente.`);
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
            toast.error("No se pudo restaurar el cliente.");
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
            toast.error("No se pudo eliminar el cliente.");
        }
    };

    return {
        tenants: filtered,
        allTenants: tenants,
        isLoading,
        isRefetching,
        refetch,
        status,
        setStatus,
        search,
        setSearch,
        handleToggle,
        handleRestore,
        handleDelete,
    };
};
