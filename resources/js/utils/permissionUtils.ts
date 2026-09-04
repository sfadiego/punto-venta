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
    | "viewEmployees"
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
    "viewEmployees",
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
        "viewEmployees",
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

export const ROLE_LABELS: Record<number, string> = {
    [RoleEnum.Employe]: "Empleado",
    [RoleEnum.Cocina]: "Cocina",
    [RoleEnum.Caja]: "Caja",
};

export const PERMISSION_LABELS: Record<Action, string> = {
    viewDashboard: "Ver dashboard",
    viewOrders: "Ver órdenes",
    viewProducts: "Ver productos",
    viewCategories: "Ver categorías",
    viewSales: "Ver ventas (histórico)",
    viewStatistics: "Ver estadísticas",
    viewAdmin: "Ver panel de administración",
    viewCloseSales: "Ver cierre de caja",
    takeOrder: "Tomar pedidos",
    payOrder: "Cobrar ventas",
    deleteOrder: "Eliminar órdenes",
    editOrderName: "Editar nombre/datos de la orden",
    printTicket: "Imprimir ticket",
    kitchenView: "Vista de cocina",
    managePendingOrders: "Gestionar órdenes pendientes",
    viewUsers: "Ver usuarios",
    viewCustomers: "Ver clientes",
    viewProviders: "Ver proveedores",
    viewEmployees: "Ver empleados",
    registerExpense: "Registrar gastos",
};

// Acciones cuya aplicabilidad depende del tipo de negocio (features), no del rol.
// Un negocio de venta por peso no tiene vista de cocina. La disponibilidad de "viewCustomers"
// ya no depende del tipo de negocio aquí — venta por peso siempre lo tiene (sell_by_weight) y
// restaurante lo activa por tenant vía business_config.customers_enabled (ver SidebarNav,
// RestaurantPayModal y CloseSalesPage, que combinan este permiso con esa bandera).
export const isActionApplicable = (action: Action, features?: IBusinessFeatures | null): boolean => {
    if (action === "kitchenView" && features?.kitchen_view === false) return false;
    return true;
};

export const getApplicableActions = (features?: IBusinessFeatures | null): Action[] =>
    ALL_ACTIONS.filter((action) => isActionApplicable(action, features));
