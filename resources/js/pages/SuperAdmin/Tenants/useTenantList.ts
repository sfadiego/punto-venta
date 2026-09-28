import { useEffect, useState } from "react";
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
import { logUnexpectedError } from "@/plugins/logger.plugin";
import { getUserFacingErrorMessage } from "@/utils/axiosError";
import { ITenant } from "@/models/ITenant";

// Límite generoso para los widgets de resumen (usuarios activos / sin actividad reciente) —
// necesitan ver TODOS los tenants elegibles para sumar bien, no solo la página actual de la
// tabla. El total real de tenants en este sistema es pequeño (decenas, no miles).
const WIDGETS_LIMIT = 200;
const DEFAULT_LIMIT = 10;
const SEARCH_DEBOUNCE_MS = 400;

const toIsDemo = (filter: TenantDemoFilterEnum): boolean | undefined =>
    filter === TenantDemoFilterEnum.Demo ? true : undefined;

export const useTenantList = () => {
    const [status, setStatus] = useState<TenantStatusEnum>(TenantStatusEnum.All);
    const [demoFilter, setDemoFilter] = useState<TenantDemoFilterEnum>(TenantDemoFilterEnum.All);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(DEFAULT_LIMIT);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [search]);

    const { data, isLoading, refetch, isRefetching } = useListTenantsPaginated({
        status,
        isDemo: toIsDemo(demoFilter),
        search: debouncedSearch || undefined,
        page,
        limit,
    });

    // Fuente independiente de la tabla — ver comentario de WIDGETS_LIMIT arriba.
    const { data: allTenants = [] } = useListTenants(TenantStatusEnum.All, 30_000, undefined, WIDGETS_LIMIT);

    const deleteMutation = useDeleteTenant();
    const toggleMutation = useToggleTenant();
    const restoreMutation = useRestoreTenant();

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleStatusChange = (value: TenantStatusEnum) => {
        setStatus(value);
        setPage(1);
    };

    const handleDemoFilterChange = (value: TenantDemoFilterEnum) => {
        setDemoFilter(value);
        setPage(1);
    };

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
        records: data?.data ?? [],
        totalRecords: data?.total ?? 0,
        perPage: data?.per_page ?? limit,
        page,
        setPage,
        limit,
        setLimit,
        allTenants,
        isLoading,
        isRefetching,
        refetch,
        status,
        setStatus: handleStatusChange,
        demoFilter,
        setDemoFilter: handleDemoFilterChange,
        search,
        setSearch: handleSearchChange,
        handleToggle,
        handleRestore,
        handleDelete,
    };
};
