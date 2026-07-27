import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosPUT } from "@/hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

const url = ApiRoutes.RolePermissions;
const QUERY_KEY = "role-permissions";

export const useIndexRolePermissions = () =>
    useGET<Record<number, string[]>>({ url, nameQuery: QUERY_KEY });

export const useUpdateRolePermission = () => {
    const { axiosApi } = useAxios();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ roleId, permissions }: { roleId: number; permissions: string[] }) =>
            axiosPUT(axiosApi, { url: `${url}/${roleId}`, data: { permissions } }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};
