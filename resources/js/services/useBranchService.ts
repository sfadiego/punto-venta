import { axiosGET, useDELETE, useGET, usePOST, usePUT } from "@/hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import {
    IBranch,
    IBranchDetail,
    IBranchListItem,
    IUserBranches,
} from "@/models/IBranch";
import { IPaginate } from "@/intefaces/IPaginate";
import { QueryClient, useQuery } from "@tanstack/react-query";

const url = ApiRoutes.Branch;

// Invalida tanto la lista paginada (DataTable de la página de Sucursales) como la lista
// liviana (selector de sucursal activa) — cualquier alta/edición/borrado de sucursal, o
// cambio de usuarios asignados, debe reflejarse en ambas.
export const invalidateBranchQueries = (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: [url] });
    queryClient.invalidateQueries({ queryKey: [`${url}/list`] });
};

// Paginado — DataTable de administración de sucursales (solo Admin, ver role.admin en el backend).
export const useIndexBranchesPaginated = ({
    page = 1,
    limit = 10,
    search = "",
    orderParam = "name",
    order = "asc",
}: {
    page?: number;
    limit?: number;
    search?: string;
    orderParam?: string;
    order?: string;
} = {}) =>
    useGET<IPaginate<IBranch>>({
        url,
        nameQuery: url,
        filters: {
            page, limit, orderParam, order,
            ...(search ? { search } : {}),
        },
    });

// Lista liviana de sucursales autorizadas del usuario autenticado — usada por el
// selector de sucursal activa (apertura de caja, formulario de producto, filtros,
// gate de selección post-login). staleTime 0: el acceso puede cambiar si el Admin
// reasigna sucursales en otra pestaña. `enabled` en false evita dispararla antes de
// tener sesión (ej. AppLayout, que se monta también en el estado no-autenticado).
export const useBranchList = (enabled: boolean = true) => {
    const { axiosApi } = useAxios();
    return useQuery<IBranchListItem[]>({
        queryKey: [`${url}/list`],
        queryFn: () => axiosGET(axiosApi, { url: `${url}/list` }),
        staleTime: 0,
        enabled,
    });
};

export const useShowBranch = (id: number) =>
    useGET<IBranchDetail>({ url: `${url}/${id}`, enable: !!id });

export const useStoreBranch = () => usePOST<IBranch>({ url });

export const useUpdateBranch = (id: number) =>
    usePUT<IBranch>({ url: `${url}/${id}` });

export const useDeleteBranch = (id: number) =>
    useDELETE({ url: `${url}/${id}` });

export const useSyncBranchUsers = (branchId: number) =>
    usePUT<IBranchDetail>({ url: `${url}/${branchId}/users` });

// Sucursales asignadas a un usuario específico (ficha de usuario/empleado) — is_admin
// indica que el usuario tiene acceso a todas sin necesidad de asignación explícita.
export const useUserBranches = (userId: number) =>
    useGET<IUserBranches>({
        url: `${ApiRoutes.AdminUsers}/${userId}/branches`,
        enable: !!userId,
    });
