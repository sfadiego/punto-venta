import { axiosGET, useDELETE, useGET, usePOST, usePUT } from "@/hooks/useApi";
import { IProvider } from "@/models/IProvider";
import { IPaginate } from "@/intefaces/IPaginate";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useQuery } from "@tanstack/react-query";
import { useAxios } from "@/hooks/useAxios";

const url = ApiRoutes.Provider;

export const useIndexProvidersPaginated = ({
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
    useGET<IPaginate<IProvider>>({
        url,
        nameQuery: url,
        filters: {
            page, limit, orderParam, order,
            ...(search ? { search } : {}),
        },
    });

export const useProviderList = () => {
    const { axiosApi } = useAxios();
    return useQuery<IProvider[]>({
        queryKey: [`${url}/list`],
        queryFn: () => axiosGET(axiosApi, { url: `${url}/list` }),
    });
};

export const useShowProvider = (id: number) =>
    useGET<IProvider>({ url: `${url}/${id}`, enable: !!id });

export const useStoreProvider = () => usePOST<IProvider>({ url });
export const useUpdateProvider = (id: number) =>
    usePUT<IProvider>({ url: `${url}/${id}` });
export const useDeleteProvider = (id: number) =>
    useDELETE({ url: `${url}/${id}` });
