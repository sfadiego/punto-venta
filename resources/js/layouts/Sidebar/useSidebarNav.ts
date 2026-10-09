import { usePermissions } from "@/hooks/usePermissions";
import { useAxios } from "@/hooks/useAxios";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";
import { isCustomersModuleEnabled } from "@/utils/customersModule";
import { navItems, NavItem } from "./navItems";

// Único lugar donde se resuelve qué items del sidebar se muestran y con qué label, para que
// SidebarNav (desktop expandido) y SidebarMini (colapsado/mobile) no dupliquen esta lógica ni
// puedan desincronizarse entre sí (ej. un feature flag nuevo que se agrega en uno y se olvida
// en el otro).
export const useSidebarNav = () => {
    const { can } = usePermissions();
    const { features } = useAxios();
    const { data: config } = useGetBusinessConfig();

    const kitchenView = features?.kitchen_view === true;
    const providersEnabled = can("viewProviders") && config?.purchases_enabled === true;
    const employeesEnabled = can("viewEmployees") && config?.employees_enabled === true;
    const customersEnabled = can("viewCustomers") && isCustomersModuleEnabled(features, config);
    // manageStock ya está gateado por features.is_retail en isActionApplicable (permissionUtils.ts)
    // — acá solo falta combinar con la config del tenant (stock_enabled).
    const inventoryEnabled = can("manageStock") && config?.stock_enabled === true;
    const statisticsEnabled = can("viewStatistics");
    const usersEnabled = can("viewUsers");
    const adminEnabled = can("viewAdmin");
    // manageBranches es Admin-exclusivo (ver permissionUtils.ts) y solo aplica si el
    // tenant tiene la feature de sucursales activa (SuperAdmin) — sin eso, la página no
    // tendría nada que administrar.
    const branchesEnabled = can("manageBranches") && config?.multi_branch_enabled === true;
    // Estadísticas/Usuarios/Configuración/Sucursales viven agrupadas bajo el dropdown
    // "General" del sidebar — se muestra si al menos una aplica para este rol/tenant.
    // Inventario NO entra aquí: es una pantalla operativa de uso diario en retail
    // (Kardex, reajustes, devoluciones), no una opción administrativa de consulta
    // esporádica — vive junto a Clientes en la lista principal (ver SidebarNav.tsx).
    const hasConfigSection = statisticsEnabled || usersEnabled || adminEnabled || branchesEnabled;

    // "Pedidos" aplica a venta por peso y Retail (ambos sin kitchen_view); "Órdenes" solo a
    // Restaurante (servicio en mesa). No usar sellByWeight aquí: Retail comparte sellByWeight=false
    // con Restaurante, así que no distingue entre ambos.
    // "layaway" (apartados) ya está gateado por features.is_retail en isActionApplicable
    // (permissionUtils.ts). Los apartados se gestionan desde Pedidos, así que el aviso de la nueva
    // función vive en ese item (solo para quien puede usarlos).
    const layawayEnabled = can("layaway");
    const items: NavItem[] = navItems
        .filter((item) => can(item.permission))
        .map((item) => {
            if (item.path !== "/orders") return item;
            return {
                ...item,
                label: kitchenView ? item.label : "Pedidos",
                ...(layawayEnabled && {
                    spotlight: {
                        key: FeatureSpotlightKey.LayawaySection,
                        title: "Apartados",
                        description: "Ahora puedes apartar productos con un anticipo y dar seguimiento a los abonos en Pedidos, en el filtro \"Apartados\".",
                    },
                }),
            };
        });

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
        branchesEnabled,
        hasConfigSection,
        hasFooterSection,
    };
};
