import { IMainOrderReport } from "@/models/IMainOrderReport";
import { useGET, usePOST } from "../hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

const url = ApiRoutes.System;
export const useGetActiveSale = (branchId?: number | null) =>
    useGET<IMainOrderReport>({
        url: `${url}/active-sale`,
        filters: branchId ? { branch_id: branchId } : {},
        nameQuery: `${url}/active-sale`,
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

export interface ILayawaySummary {
    abonos: number;
    reembolsos: number;
    neto: number;
}

// Devoluciones de venta reembolsadas en la sesión (retail). `total` ya está descontado de las ventas del
// día; `balance_applied` es la parte que bajó el saldo de clientes a crédito y no salió de la caja.
export interface IReturnsSummary {
    total: number;
    balance_applied: number;
    cash_out: number;
    count: number;
}

export interface ITotalCurrentSale {
    bruto: number;
    domicilios: number;
    neto: number;
    propinas: number;
    gastos: number;
    apartados: ILayawaySummary;
    devoluciones: IReturnsSummary;
    by_payment_method: IPaymentMethodTotal[];
}

export const useCurrentTotalSale = (systemId: number | null) =>
    useGET<ITotalCurrentSale>({ url: `${url}/${systemId}/total-current-sales`, enable: !!systemId && systemId > 0 });

