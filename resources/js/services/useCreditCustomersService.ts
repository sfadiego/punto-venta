import { useGET } from "@/hooks/useApi";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { ICreditCustomer } from "@/models/ICreditCustomer";

export const useCreditCustomers = (sistemaId: number | null) =>
    useGET<ICreditCustomer[]>({
        url: ApiRoutes.OrderCreditCustomers,
        filters: sistemaId ? { sistema_id: sistemaId } : {},
        enable: !!sistemaId,
        nameQuery: `${ApiRoutes.OrderCreditCustomers}-${sistemaId ?? "any"}`,
    });
