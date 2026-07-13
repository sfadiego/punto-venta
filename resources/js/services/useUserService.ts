import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosPUT, useGET } from "@/hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IPaginate } from "@/intefaces/IPaginate";
import { IUser, IUpdateUserPayload } from "@/models/IUser";

const url = ApiRoutes.AdminUsers;
const QUERY_KEY = url;

export const useIndexUsers = ({
    page = 1,
    limit = 10,
    search = "",
}: { page?: number; limit?: number; search?: string } = {}) =>
    useGET<IPaginate<IUser>>({
        url,
        nameQuery: QUERY_KEY,
        filters: { page, limit, ...(search ? { search } : {}) },
    });

export const useUpdateUser = () => {
    const { axiosApi } = useAxios();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: number; data: IUpdateUserPayload }) =>
            axiosPUT(axiosApi, { url: `${url}/${id}`, data }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] }),
    });
};
