import { useAxios } from "@/hooks/useAxios";
import { useIndexOrder } from "@/services/useOrderService";
import { OrderStatusEnum } from "@/enums/OrderStatusEnum";

import { localDateString } from "@/utils/dateUtils";

const today = () => localDateString();

export const useRecentSales = () => {
    const { sistemaId, features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;

    const { data, isLoading, isFetching } = useIndexOrder({
        sistema_id: sistemaId,
        estatus_pedido_id: sellByWeight ? OrderStatusEnum.InProcess : OrderStatusEnum.Closed,
        // sell_by_weight: sistema_id already scopes the session; fecha (UTC) can mismatch
        // MySQL timezone in production, so we omit it and rely on sistema_id alone.
        fecha: sellByWeight ? undefined : today(),
        limit: 20,
        order: "desc",
    });

    return {
        sales: data?.data ?? [],
        total: data?.total ?? 0,
        isLoading,
        isRefetching: isFetching && !isLoading,
        sistemaId,
        sellByWeight,
    };
};
