import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosDELETE, useGET, usePOST } from "@/hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IEmployeeAbsence } from "@/models/IEmployeeAbsence";

const url = (employeeId: number) => `${ApiRoutes.Employee}/${employeeId}/absence`;

export const useIndexEmployeeAbsences = (employeeId: number) =>
    useGET<IEmployeeAbsence[]>({ url: url(employeeId), nameQuery: url(employeeId), enable: !!employeeId });

export const useStoreEmployeeAbsence = (employeeId: number) =>
    usePOST<IEmployeeAbsence>({ url: url(employeeId) });

export const useDeleteEmployeeAbsence = (employeeId: number) => {
    const { axiosApi } = useAxios();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (absenceId: number) => axiosDELETE(axiosApi, { url: `${url(employeeId)}/${absenceId}` }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: [url(employeeId)] }),
    });
};
