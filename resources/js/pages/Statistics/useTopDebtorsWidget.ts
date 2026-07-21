import { useNavigate } from "react-router-dom";
import { useIndexCustomersPaginated } from "@/services/useCustomerService";
import { AdminRoutes } from "@/enums/RoutesEnum";

export const useTopDebtorsWidget = () => {
    const navigate = useNavigate();

    const { data, isLoading } = useIndexCustomersPaginated({
        limit: 5,
        withDebt: true,
        orderParam: "balance",
        order: "desc",
    });

    const goToCustomer = (id: number) => navigate(AdminRoutes.CustomerDetail.replace(":id", String(id)));

    return { debtors: data?.data ?? [], isLoading, goToCustomer };
};
