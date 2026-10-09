import { axiosGET, useGET } from "@/hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { ITopDebtors } from "@/models/ITopDebtors";

// Solo retail y venta por peso (el backend responde 403 en los demás tipos de negocio).
export const useTopDebtors = (enabled = true) =>
    useGET<ITopDebtors>({ url: ApiRoutes.StatisticsTopDebtors, enable: enabled });

// Descarga en CSV de toda la cartera de clientes con adeudo (no solo el top 10).
export const useExportTopDebtors = () => {
    const { axiosApi } = useAxios();

    return (): Promise<Blob> =>
        axiosGET(axiosApi, { url: `${ApiRoutes.StatisticsTopDebtors}/export`, responseType: "blob" });
};
