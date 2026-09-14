import { Fragment } from "react";
import { Users, Settings, HandCoins, Truck, UserRound, Boxes, BarChart2, SlidersHorizontal } from "lucide-react";
import { FeatureSpotlight } from "@/components/ui/interactions/FeatureSpotlight/FeatureSpotlight";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";
import { useSidebarNav } from "./useSidebarNav";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarNavDropdown } from "./SidebarNavDropdown";

interface SidebarNavProps {
    onItemClick: () => void;
}

export function SidebarNav({ onItemClick }: SidebarNavProps) {
    const {
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
    } = useSidebarNav();

    return (
        <nav className="flex-1 px-3 py-5 overflow-y-auto flex flex-col">
            <div className="space-y-0.5 flex-1">
                {items.map((item) => (
                    <Fragment key={item.path}>
                        {item.spotlight ? (
                            <FeatureSpotlight
                                featureKey={item.spotlight.key}
                                title={item.spotlight.title}
                                description={item.spotlight.description}
                                variant="block"
                                placement="right-start"
                            >
                                <SidebarNavItem item={item} onClick={onItemClick} />
                            </FeatureSpotlight>
                        ) : (
                            <SidebarNavItem item={item} onClick={onItemClick} />
                        )}

                        {item.path === "/sales" && customersEnabled && (
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

                        {item.path === "/sales" && inventoryEnabled && (
                            <SidebarNavItem
                                item={{ label: "Inventario", icon: Boxes, path: "/inventory", permission: "manageStock" }}
                                onClick={onItemClick}
                            />
                        )}
                    </Fragment>
                ))}
            </div>

            {hasFooterSection && (
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
                    {employeesEnabled && (
                        <FeatureSpotlight
                            featureKey={FeatureSpotlightKey.EmployeesNavItem}
                            title="Sección de Empleados"
                            description="Descubre la nueva sección de empleados, donde podrás gestionar y visualizar el registro de tu plantilla."
                            variant="block"
                            placement="right-start"
                        >
                            <SidebarNavItem
                                item={{ label: "Empleados", icon: UserRound, path: "/employees", permission: "viewEmployees" }}
                                onClick={onItemClick}
                            />
                        </FeatureSpotlight>
                    )}
                    {hasConfigSection && (
                        <FeatureSpotlight
                            featureKey={FeatureSpotlightKey.ConfigurationSection}
                            title="Sección de Configuración"
                            description="Descubre la nueva sección de configuración, donde podrás gestionar y visualizar estadísticas, usuarios y la configuración de tu sistema."
                            variant="block"
                            placement="right-start"
                        >
                            <SidebarNavDropdown
                                label="General"
                                icon={SlidersHorizontal}
                                onItemClick={onItemClick}
                                items={[
                                    ...(statisticsEnabled ? [{ label: "Estadísticas", icon: BarChart2, path: "/statistics" }] : []),
                                    ...(usersEnabled ? [{ label: "Usuarios", icon: Users, path: "/users" }] : []),
                                    ...(adminEnabled ? [{ label: "Configuración", icon: Settings, path: "/admin" }] : []),
                                ]}
                            />
                        </FeatureSpotlight>
                    )}
                </div>
            )}
        </nav>
    );
}
