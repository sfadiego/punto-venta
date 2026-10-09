import { axiosGET, useDELETE, useGET, usePATCH, usePOST, usePUT } from "@/hooks/useApi";
import { ICustomer, ICustomerCharge, ICustomerDetail, ICustomerPayment } from "@/models/ICustomer";
import { IPaginate } from "@/intefaces/IPaginate";
import { ITopDebtorsSummary } from "@/models/ITopDebtors";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { useAxios } from "@/hooks/useAxios";

const url = ApiRoutes.Customer;

// Invalida tanto la lista paginada (DataTable de la página de Clientes) como la lista
// liviana (picker de crédito en QuickSale/PayModal) — cualquier alta/edición/borrado de
// cliente debe reflejarse en ambas, sin importar desde qué flujo se disparó la mutación.
export const invalidateCustomerQueries = (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: [url] });
    queryClient.invalidateQueries({ queryKey: [`${url}/list`] });
    // El adeudo de los clientes alimenta "Clientes con adeudo" de Estadísticas.
    queryClient.invalidateQueries({ queryKey: [`${url}/debt-summary`] });
    // El detalle de una orden trae el saldo del cliente: un abono, cargo o devolución lo deja desactualizado
    // (claves "/api/order/{id}", que no son prefijo de la lista "/api/order").
    queryClient.invalidateQueries({
        predicate: ({ queryKey }) => typeof queryKey[0] === "string" && queryKey[0].startsWith(`${ApiRoutes.Orders}/`),
    });
    queryClient.invalidateQueries({ queryKey: [ApiRoutes.StatisticsTopDebtors] });
};

// Resumen del adeudo de clientes (por cobrar, clientes con adeudo, concentración) — página de Clientes.
export const useCustomerDebtSummary = () =>
    useGET<ITopDebtorsSummary>({ url: `${url}/debt-summary` });

// Paginated — used for the customers DataTable
export const useIndexCustomersPaginated = ({
    page = 1,
    limit = 10,
    search = "",
    withDebt = false,
    withLayaway = false,
    layawayOverdue = false,
    orderParam = "name",
    order = "asc",
}: {
    page?: number;
    limit?: number;
    search?: string;
    withDebt?: boolean;
    // Solo clientes con apartados activos / con algún apartado vencido (retail).
    withLayaway?: boolean;
    layawayOverdue?: boolean;
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
            ...(withLayaway ? { with_layaway: 1 } : {}),
            ...(layawayOverdue ? { layaway_overdue: 1 } : {}),
        },
    });

// Lightweight full list — used by the sale-modal customer picker.
// staleTime 8s: el saldo/allow_credit debe estar razonablemente al día para decidir si se
// puede fiar, pero 0 refrescaba la lista completa cada vez que un cajero abría/cerraba el
// modal de cobro — con muchos cajeros cobrando seguido, eso es una petición extra por venta.
// 8s cubre aperturas rápidas repetidas sin notarse (nadie fía dos veces en <8s al mismo
// cliente) y sigue siendo prácticamente "al día" para el caso real.
export const useCustomerList = () => {
    const { axiosApi } = useAxios();
    return useQuery<ICustomer[]>({
        queryKey: [`${url}/list`],
        queryFn: () => axiosGET(axiosApi, { url: `${url}/list` }),
        staleTime: 8_000,
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
export const useRegisterCustomerCharge = (id: number) =>
    usePOST<ICustomerCharge>({ url: `${url}/${id}/charge` });
