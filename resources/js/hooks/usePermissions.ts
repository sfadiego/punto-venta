import { useAxios } from "@/hooks/useAxios";
import { RoleEnum } from "@/enums/RoleEnum";

type Action =
    | "viewDashboard"
    | "viewOrders"
    | "viewProducts"
    | "viewCategories"
    | "viewSales"
    | "viewStatistics"
    | "viewAdmin"
    | "viewCloseSales"
    | "takeOrder"
    | "payOrder"
    | "deleteOrder"
    | "editOrderName"
    | "printTicket"
    | "kitchenView";

const ROLE_PERMISSIONS: Record<number, Set<Action>> = {
    [RoleEnum.Admin]: new Set<Action>([
        "viewDashboard",
        "viewOrders",
        "viewProducts",
        "viewCategories",
        "viewSales",
        "viewStatistics",
        "viewAdmin",
        "viewCloseSales",
        "takeOrder",
        "payOrder",
        "deleteOrder",
        "editOrderName",
        "printTicket",
        "kitchenView",
    ]),
    [RoleEnum.Employe]: new Set<Action>([
        "viewDashboard",
        "viewOrders",
        "viewProducts",
        "takeOrder",
        "editOrderName",
        "printTicket",
    ]),
    [RoleEnum.Cocina]: new Set<Action>([
        "viewDashboard",
        "viewOrders",
        "kitchenView",
        "printTicket",
    ]),
    [RoleEnum.Caja]: new Set<Action>([
        "viewDashboard",
        "viewOrders",
        "payOrder",
        "printTicket",
    ]),
};

export const usePermissions = () => {
    const { user, features } = useAxios();
    const rolId = user?.rol_id ?? RoleEnum.Employe;
    const basePermissions = ROLE_PERMISSIONS[rolId] ?? ROLE_PERMISSIONS[RoleEnum.Employe];

    const can = (action: Action): boolean => {
        if (action === "kitchenView" && features?.kitchen_view === false) return false;
        return basePermissions.has(action);
    };

    const hasRole = (...roles: RoleEnum[]): boolean =>
        roles.includes(rolId as RoleEnum);

    return { can, hasRole, rolId };
};
