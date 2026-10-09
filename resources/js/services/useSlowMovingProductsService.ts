import { axiosGET, useGET } from "@/hooks/useApi";
import { useAxios } from "@/hooks/useAxios";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { IPaginate } from "@/intefaces/IPaginate";
import { ISlowMovingFilters, ISlowMovingProduct, ISlowMovingSummary } from "@/models/ISlowMovingProduct";

const url = ApiRoutes.StatisticsSlowMoving;

const buildFilters = ({ days, search, categoria_id, orderParam, order }: ISlowMovingFilters) => ({
    days,
    ...(search ? { search } : {}),
    ...(categoria_id ? { categoria_id } : {}),
    ...(orderParam ? { orderParam } : {}),
    ...(order ? { order } : {}),
});

export const useSlowMovingProducts = (filters: ISlowMovingFilters & { page: number; limit: number }, enabled = true) =>
    useGET<IPaginate<ISlowMovingProduct>>({
        url,
        filters: { ...buildFilters(filters), page: filters.page, limit: filters.limit },
        enable: enabled,
    });

export const useSlowMovingSummary = (days: number, enabled = true) =>
    useGET<ISlowMovingSummary>({ url: `${url}/summary`, filters: { days }, enable: enabled });

// Descarga en CSV del listado completo del filtro activo (sin paginar ni ordenar: el backend usa su orden por defecto).
export const useExportSlowMoving = () => {
    const { axiosApi } = useAxios();

    return (filters: ISlowMovingFilters): Promise<Blob> =>
        axiosGET(axiosApi, {
            url: `${url}/export`,
            params: buildFilters({ days: filters.days, search: filters.search, categoria_id: filters.categoria_id }),
            responseType: "blob",
        });
};
