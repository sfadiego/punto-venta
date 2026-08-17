import { usePermissions } from "@/hooks/usePermissions";
import { useAxios } from "@/hooks/useAxios";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { navItems, NavItem } from "./navItems";

// Único lugar donde se resuelve qué items del sidebar se muestran y con qué label, para que
// SidebarNav (desktop expandido) y SidebarMini (colapsado/mobile) no dupliquen esta lógica ni
// puedan desincronizarse entre sí (ej. un feature flag nuevo que se agrega en uno y se olvida
// en el otro).
export const useSidebarNav = () => {
    const { can } = usePermissions();
    const { features } = useAxios();
    const { data: config } = useGetBusinessConfig();

    const sellByWeight = features?.sell_by_weight === true;
    const kitchenView = features?.kitchen_view === true;
    const providersEnabled = can("viewProviders") && config?.purchases_enabled === true;
    const employeesEnabled = can("viewEmployees") && config?.employees_enabled === true;
    const customersEnabled = can("viewCustomers") && (sellByWeight || config?.customers_enabled === true);

    // "Pedidos" aplica a venta por peso y Retail (ambos sin kitchen_view); "Órdenes" solo a
    // Restaurante (servicio en mesa). No usar sellByWeight aquí: Retail comparte sellByWeight=false
    // con Restaurante, así que no distingue entre ambos.
    const items: NavItem[] = navItems
        .filter((item) => can(item.permission))
        .map((item) =>
            item.path === "/orders" && !kitchenView ? { ...item, label: "Pedidos" } : item,
        );

    const hasFooterSection =
        can("viewUsers") || can("viewAdmin") || customersEnabled || providersEnabled || employeesEnabled;

    return {
        can,
        items,
        providersEnabled,
        employeesEnabled,
        customersEnabled,
        hasFooterSection,
    };
};
