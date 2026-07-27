import {
    LayoutDashboard,
    Package,
    Tag,
    BarChart2,
    ShoppingBag,
    LucideIcon,
    Coffee,
} from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";

type Action = Parameters<ReturnType<typeof usePermissions>["can"]>[0];

export interface NavItemSpotlight {
    key: FeatureSpotlightKey;
    title: string;
    description: string;
}

export interface NavItem {
    label: string;
    icon: LucideIcon;
    path: string;
    permission: Action;
    /** Opcional: si se define, el item se envuelve en un FeatureSpotlight al renderizarse. */
    spotlight?: NavItemSpotlight;
}

export const navItems: NavItem[] = [
    { label: "Dashboard", icon: LayoutDashboard, path: "/", permission: "viewDashboard" },
    { label: "Órdenes", icon: Package, path: "/orders", permission: "viewOrders" },
    {
        label: "Productos",
        icon: Coffee,
        path: "/products",
        permission: "viewProducts",
        spotlight: {
            key: FeatureSpotlightKey.ProductSection,
            title: "Sección de Productos",
            description: "Descubre la sección de productos, donde podrás gestionar y visualizar tu catálogo de manera eficiente.",
        },
    },
    {
        label: "Categorías",
        icon: Tag,
        path: "/categories",
        permission: "viewCategories",
        spotlight: {
            key: FeatureSpotlightKey.CategoriesSection,
            title: "Sección de Categorías",
            description: "Descubre la sección de categorías, donde podrás gestionar y visualizar tus categorias y asignarlas a productos.",
        },
    },
    { label: "Ventas", icon: ShoppingBag, path: "/sales", permission: "viewSales" },
    { label: "Estadísticas", icon: BarChart2, path: "/statistics", permission: "viewStatistics" },
];
