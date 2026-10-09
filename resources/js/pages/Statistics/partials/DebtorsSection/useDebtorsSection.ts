import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminRoutes } from "@/enums/RoutesEnum";
import { useAxios } from "@/hooks/useAxios";
import { useTopDebtors } from "@/services/useTopDebtorsService";
import { buildDebtorsColumns } from "./debtorsColumns";

// Query param con el que la página de Clientes abre ya filtrada "Solo con adeudo".
export const CUSTOMERS_WITH_DEBT_PARAM = "con_adeudo";

export const useDebtorsSection = () => {
    const navigate = useNavigate();
    const { features } = useAxios();
    const { data, isLoading } = useTopDebtors();
    // Los apartados son exclusivos de retail.
    const columns = useMemo(() => buildDebtorsColumns(features?.is_retail === true), [features?.is_retail]);

    return {
        summary: data?.summary,
        rows: data?.rows ?? [],
        columns,
        isLoading,
        goToCustomer: (id: number) => navigate(AdminRoutes.CustomerDetail.replace(":id", String(id))),
        goToAllDebtors: () => navigate(`${AdminRoutes.CustomerList}?${CUSTOMERS_WITH_DEBT_PARAM}=1`),
    };
};
