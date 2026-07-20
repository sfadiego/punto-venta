import { axiosGET, useDELETE, useGET, usePATCH, usePOST, usePUT } from "@/hooks/useApi";
import { ICustomer, ICustomerDetail, ICustomerPayment } from "@/models/ICustomer";
import { IPaginate } from "@/intefaces/IPaginate";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useQuery } from "@tanstack/react-query";
import { useAxios } from "@/hooks/useAxios";

const url = ApiRoutes.Customer;

// Paginated — used for the customers DataTable
export const useIndexCustomersPaginated = ({
    page = 1,
    limit = 10,
    search = "",
    withDebt = false,
    orderParam = "name",
    order = "asc",
}: {
    page?: number;
    limit?: number;
    search?: string;
    withDebt?: boolean;
    orderParam?: string;
    order?: string;
} = {}) =>
    useGET<IPaginate<ICustomer>>({
        url,
        nameQuery: url,
        filters: {
            page, limit, orderParam, order,
            ...(search ? { search } : {}),
            ...(withDebt ? { with_debt: 1 } : {}),
        },
    });

// Lightweight full list — used by the sale-modal customer picker.
// staleTime 0: siempre refresca al montar (ej. al abrir el modal de cobro),
// ya que el saldo/allow_credit debe estar al día para decidir si se puede fiar.
export const useCustomerList = () => {
    const { axiosApi } = useAxios();
    return useQuery<ICustomer[]>({
        queryKey: [`${url}/list`],
        queryFn: () => axiosGET(axiosApi, { url: `${url}/list` }),
        staleTime: 0,
    });
};

export const useShowCustomer = (id: number) =>
    useGET<ICustomerDetail>({ url: `${url}/${id}`, enable: !!id });

export const useStoreCustomer = () => usePOST<ICustomer>({ url });
export const useUpdateCustomer = (id: number) =>
    usePUT<ICustomer>({ url: `${url}/${id}` });
export const useDeleteCustomer = (id: number) =>
    useDELETE({ url: `${url}/${id}` });
export const useToggleCustomerCredit = (id: number) =>
    usePATCH<ICustomer>({ url: `${url}/${id}/toggle-credit` });
export const useRegisterCustomerPayment = (id: number) =>
    usePOST<ICustomerPayment>({ url: `${url}/${id}/payment` });
