import { Users, Settings, HandCoins, Truck } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { useAxios } from "@/hooks/useAxios";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { FeatureSpotlight } from "@/components/ui/interactions/FeatureSpotlight/FeatureSpotlight";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";
import { navItems } from "./navItems";
import { SidebarNavItem } from "./SidebarNavItem";

interface SidebarNavProps {
    onItemClick: () => void;
}

export function SidebarNav({ onItemClick }: SidebarNavProps) {
    const { can } = usePermissions();
    const { features } = useAxios();
    const { data: config } = useGetBusinessConfig();
    const sellByWeight = features?.sell_by_weight === true;
    const providersEnabled = can("viewProviders") && config?.purchases_enabled === true;

    return (
        <nav className="flex-1 px-3 py-5 overflow-y-auto flex flex-col">
            <div className="space-y-0.5 flex-1">
                {navItems
                    .filter((item) => can(item.permission))
                    .map((item) => {
                        const resolvedItem =
                            item.path === "/orders" && sellByWeight
                                ? { ...item, label: "Pedidos" }
                                : item;

                        if (!item.spotlight) {
                            return <SidebarNavItem key={item.path} item={resolvedItem} onClick={onItemClick} />;
                        }

                        return (
                            <FeatureSpotlight
                                key={item.path}
                                featureKey={item.spotlight.key}
                                title={item.spotlight.title}
                                description={item.spotlight.description}
                                variant="block"
                                placement="right-start"
                            >
                                <SidebarNavItem item={resolvedItem} onClick={onItemClick} />
                            </FeatureSpotlight>
                        );
                    })}
            </div>

            {(can("viewUsers") || can("viewAdmin") || can("viewCustomers") || providersEnabled) && (
                <div className="pt-3 border-t border-white/10 mt-3 space-y-0.5">
                    {providersEnabled && (
                        <FeatureSpotlight
                            featureKey={FeatureSpotlightKey.ProvidersNavItem}
                            title="Sección de Proveedores"
                            description="Descubre la nueva sección de proveedores, donde podrás gestionar y visualizar el registro de tus proveedores y compras."
                            variant="block"
                            placement="right-start"
                        >
                            <SidebarNavItem
                                item={{ label: "Proveedores", icon: Truck, path: "/providers", permission: "viewProviders" }}
                                onClick={onItemClick}
                            />
                        </FeatureSpotlight>
                    )}
                    {can("viewCustomers") && (
                        <FeatureSpotlight
                            featureKey={FeatureSpotlightKey.CustomerSection}
                            title="Sección de Clientes"
                            description="Descubre la nueva sección de clientes, donde podrás gestionar y visualizar toda la información de tus clientes de manera eficiente."
                            variant="block"
                            placement="right-start"
                        >
                            <SidebarNavItem
                                item={{ label: "Clientes", icon: HandCoins, path: "/customers", permission: "viewCustomers" }}
                                onClick={onItemClick}
                            />
                        </FeatureSpotlight>
                    )}
                    {can("viewUsers") && (
                        <FeatureSpotlight
                            featureKey={FeatureSpotlightKey.UsersSection}
                            title="Sección de Usuarios"
                            description="Descubre la nueva sección de usuarios, donde podrás gestionar y visualizar toda la información de tus usuarios de manera eficiente."
                            variant="block"
                            placement="right-start"
                        >
                            <SidebarNavItem
                                item={{ label: "Usuarios", icon: Users, path: "/users", permission: "viewUsers" }}
                                onClick={onItemClick}
                            />
                        </FeatureSpotlight>
                    )}
                    {can("viewAdmin") && (
                        <FeatureSpotlight
                            featureKey={FeatureSpotlightKey.ConfigurationSection}
                            title="Sección de Configuración"
                            description="Descubre la nueva sección de configuración, donde podrás gestionar y visualizar toda la información de tu sistema de manera eficiente."
                            variant="block"
                            placement="right-start"
                        >
                            <SidebarNavItem
                                item={{ label: "Configuración", icon: Settings, path: "/admin", permission: "viewAdmin" }}
                                onClick={onItemClick}
                            />
                        </FeatureSpotlight>
                    )}
                </div>
            )}
        </nav>
    );
}
