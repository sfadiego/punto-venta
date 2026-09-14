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
    // manageStock ya está gateado por features.is_retail en isActionApplicable (permissionUtils.ts)
    // — acá solo falta combinar con la config del tenant (stock_enabled).
    const inventoryEnabled = can("manageStock") && config?.stock_enabled === true;
    const statisticsEnabled = can("viewStatistics");
    const usersEnabled = can("viewUsers");
    const adminEnabled = can("viewAdmin");
    // Estadísticas/Usuarios/Configuración viven agrupadas bajo el dropdown "General" del
    // sidebar — se muestra si al menos una aplica para este rol/tenant. Inventario NO entra
    // aquí: es una pantalla operativa de uso diario en retail (Kardex, reajustes,
    // devoluciones), no una opción administrativa de consulta esporádica — vive junto a
    // Clientes en la lista principal (ver SidebarNav.tsx).
    const hasConfigSection = statisticsEnabled || usersEnabled || adminEnabled;

    // "Pedidos" aplica a venta por peso y Retail (ambos sin kitchen_view); "Órdenes" solo a
    // Restaurante (servicio en mesa). No usar sellByWeight aquí: Retail comparte sellByWeight=false
    // con Restaurante, así que no distingue entre ambos.
    const items: NavItem[] = navItems
        .filter((item) => can(item.permission))
        .map((item) =>
            item.path === "/orders" && !kitchenView ? { ...item, label: "Pedidos" } : item,
        );

    const hasFooterSection = providersEnabled || employeesEnabled || hasConfigSection;

    return {
        can,
        items,
        providersEnabled,
        employeesEnabled,
        customersEnabled,
        inventoryEnabled,
        statisticsEnabled,
        usersEnabled,
        adminEnabled,
        hasConfigSection,
        hasFooterSection,
    };
};
