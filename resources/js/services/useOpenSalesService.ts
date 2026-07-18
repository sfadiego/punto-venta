import { IMainOrderReport } from "@/models/IMainOrderReport";
import { useGET, usePOST } from "../hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

const url = ApiRoutes.System;
export const useGetActiveSale = () =>
    useGET<IMainOrderReport>({
        url: `${url}/active-sale`,
    });
export const useStoreOpenSales = () => usePOST({ url: `${url}/open` });
export const useCloseSales = (systemId: number) =>
    usePOST({ url: `${url}/${systemId}/close` });

export interface IPaymentMethodTotal {
    payment_method_id: number | null;
    name: string;
    total: number;
    propina: number;
}

export interface ITotalCurrentSale {
    bruto: number;
    domicilios: number;
    neto: number;
    propinas: number;
    by_payment_method: IPaymentMethodTotal[];
}

export const useCurrentTotalSale = (systemId: number | null) =>
    useGET<ITotalCurrentSale>({ url: `${url}/${systemId}/total-current-sales`, enable: !!systemId && systemId > 0 });

