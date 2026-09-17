import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { superAdminAxios } from "@/contexts/SuperAdminContext";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IBranch, IBranchFormPayload } from "@/models/IBranch";
import { TENANT_QUERY_KEY } from "@/services/useSuperAdminService";

const baseUrl = (tenantId: number) => `${ApiRoutes.SuperAdminTenant}/${tenantId}/branches`;
const QUERY_KEY = "tenant-branches";

// Sucursales de un tenant, gestionadas desde el panel de SuperAdmin — creación inicial y
// activación de la feature (multi_branch_enabled) son exclusivas de SuperAdmin; la
// administración del día a día (renombrar, activar/desactivar, asignar usuarios) vive
// en useBranchService.ts, del lado del tenant Admin.
export const useListTenantBranches = (tenantId: number) =>
    useQuery<IBranch[]>({
        queryKey: [QUERY_KEY, tenantId],
        queryFn: async () => {
            const res = await superAdminAxios.get(baseUrl(tenantId));
            return res.data.data as IBranch[];
        },
        enabled: !!tenantId,
    });

export const useCreateTenantBranch = (tenantId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (payload: IBranchFormPayload) =>
            superAdminAxios.post(baseUrl(tenantId), payload),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] }),
    });
};

// Activa multi_branch_enabled para el tenant: crea la sucursal "Principal" y hace
// backfill de las cajas existentes que aún no tenían sucursal asignada.
export const useEnableTenantBranches = (tenantId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => superAdminAxios.post(`${baseUrl(tenantId)}/enable`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] });
            // TenantBranchesSection decide si mostrar "Agregar sucursal" según
            // tenantDetail.multi_branch_enabled (useGetTenant, query separada de esta) —
            // sin invalidarla también, la UI se queda mostrando el botón "Activar
            // sucursales" hasta que el usuario refresca la página a mano.
            qc.invalidateQueries({ queryKey: [TENANT_QUERY_KEY, "detail", tenantId] });
        },
    });
};

export const useUpdateTenantBranch = (tenantId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: IBranchFormPayload }) =>
            superAdminAxios.put(`${baseUrl(tenantId)}/${id}`, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] }),
    });
};

export const useToggleTenantBranchActive = (tenantId: number) => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (branchId: number) =>
            superAdminAxios.patch(`${baseUrl(tenantId)}/${branchId}/toggle`),
        onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY, tenantId] }),
    });
};
