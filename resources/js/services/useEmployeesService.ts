import { axiosGET, useDELETE, useGET, usePATCH, usePOST, usePUT } from "@/hooks/useApi";
import { IEmployee, IEmployeePayrollSummary, PayrollFilterPeriod } from "@/models/IEmployee";
import { IPaginate } from "@/intefaces/IPaginate";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { useQuery } from "@tanstack/react-query";
import { useAxios } from "@/hooks/useAxios";

const url = ApiRoutes.Employee;

export const useIndexEmployeesPaginated = ({
    page = 1,
    limit = 10,
    search = "",
    active = "",
    orderParam = "name",
    order = "asc",
}: {
    page?: number;
    limit?: number;
    search?: string;
    active?: string;
    orderParam?: string;
    order?: string;
} = {}) =>
    useGET<IPaginate<IEmployee>>({
        url,
        nameQuery: url,
        filters: {
            page, limit, orderParam, order,
            ...(search ? { search } : {}),
            ...(active ? { active } : {}),
        },
    });

export const useEmployeeList = () => {
    const { axiosApi } = useAxios();
    return useQuery<IEmployee[]>({
        queryKey: [`${url}/list`],
        queryFn: () => axiosGET(axiosApi, { url: `${url}/list` }),
    });
};

export const useShowEmployee = (id: number) =>
    useGET<IEmployee>({ url: `${url}/${id}`, enable: !!id });

export const useEmployeePayrollSummary = (period: PayrollFilterPeriod) =>
    useGET<IEmployeePayrollSummary>({
        url: `${url}/payroll-summary`,
        nameQuery: `${url}/payroll-summary`,
        filters: { period },
    });

export const useStoreEmployee = () => usePOST<IEmployee>({ url });
export const useUpdateEmployee = (id: number) =>
    usePUT<IEmployee>({ url: `${url}/${id}` });
export const useDeleteEmployee = (id: number) =>
    useDELETE({ url: `${url}/${id}` });
export const useToggleEmployeeActive = (id: number) =>
    usePATCH<IEmployee>({ url: `${url}/${id}/toggle-active` });
