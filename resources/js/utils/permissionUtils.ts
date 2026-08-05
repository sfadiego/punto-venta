import { RoleEnum } from "@/enums/RoleEnum";
import { IBusinessFeatures } from "@/enums/BusinessTypeEnum";

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
    | "viewProviders"
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
    "viewProviders",
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
        "viewProviders",
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

// Acciones cuya aplicabilidad depende del tipo de negocio (features), no del rol.
// Un negocio de venta por peso no tiene vista de cocina; "viewCustomers" (clientes a
// crédito) hoy solo aplica a venta por peso.
export const isActionApplicable = (action: Action, features?: IBusinessFeatures | null): boolean => {
    if (action === "kitchenView" && features?.kitchen_view === false) return false;
    if (action === "viewCustomers" && features?.sell_by_weight !== true) return false;
    return true;
};

export const getApplicableActions = (features?: IBusinessFeatures | null): Action[] =>
    ALL_ACTIONS.filter((action) => isActionApplicable(action, features));
