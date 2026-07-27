import { useAxios } from "@/hooks/useAxios";
import { RoleEnum } from "@/enums/RoleEnum";

export type Action =
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
    | "kitchenView"
    | "managePendingOrders"
    | "viewUsers"
    | "viewCustomers"
    | "registerExpense";

export const ALL_ACTIONS: Action[] = [
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
    "managePendingOrders",
    "viewUsers",
    "viewCustomers",
    "registerExpense",
];

export const DEFAULT_ROLE_PERMISSIONS: Record<number, Set<Action>> = {
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
        "managePendingOrders",
        "viewUsers",
        "viewCustomers",
        "registerExpense",
    ]),
    [RoleEnum.Employe]: new Set<Action>([
        "viewDashboard",
        "viewOrders",
        "viewProducts",
        "takeOrder",
        "editOrderName",
        "printTicket",
        "kitchenView",
        "payOrder",
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
        "registerExpense",
    ]),
};

export const usePermissions = () => {
    const { user, features, rolePermissions } = useAxios();
    const rolId = user?.rol_id ?? RoleEnum.Employe;
    const isConfigurableRole = rolId !== RoleEnum.Admin && rolId !== RoleEnum.SuperAdmin;
    const roleOverride = isConfigurableRole ? rolePermissions?.[rolId] as Action[] | undefined : undefined;
    const basePermissions = roleOverride
        ? new Set<Action>(roleOverride)
        : DEFAULT_ROLE_PERMISSIONS[rolId] ?? DEFAULT_ROLE_PERMISSIONS[RoleEnum.Employe];

    const can = (action: Action): boolean => {
        if (action === "kitchenView" && features?.kitchen_view === false) return false;
        if (action === "viewCustomers" && features?.sell_by_weight !== true) return false;
        return basePermissions.has(action);
    };

    const hasRole = (...roles: RoleEnum[]): boolean =>
        roles.includes(rolId as RoleEnum);

    return { can, hasRole, rolId };
};
