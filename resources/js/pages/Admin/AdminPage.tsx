import { Settings } from "lucide-react";
import { LogoSection } from "./partials/Logo/LogoSection";
import { ColorsSection } from "./partials/Colors/ColorsSection";
import { BusinessInfoSection } from "./partials/BusinessInfo/BusinessInfoSection";
import { PrinterSection } from "./partials/Printer/PrinterSection";
import { DeliverySection } from "./partials/Delivery/DeliverySection";
import { ScaleSection } from "./partials/Scale/ScaleSection";
import { MenuSection } from "./partials/Menu/MenuSection";
import { ReadonlyMenuQrSection } from "./partials/Menu/ReadonlyMenuQrSection";
import { ProvidersSection } from "./partials/Purchases/ProvidersSection";
import { EmployeesSection } from "./partials/Employees/EmployeesSection";
import { RolesPermissionsSection } from "./partials/RolesPermissions/RolesPermissionsSection";
import { AdminNav } from "./partials/AdminNav";
import { SubscriptionInfoSection } from "@/components/Admin/SubscriptionInfoSection";
import { useAdminPage } from "./useAdminPage";
import { FeatureSpotlight } from "@/components/ui/interactions/FeatureSpotlight/FeatureSpotlight";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";

function AdminPage() {
    const { config, isLoading, sellByWeight, isReadOnly } = useAdminPage();
    const printerVisible = import.meta.env.VITE_APP_ENV === "local"
        || config?.printer_enabled === true
        || config?.bluetooth_printing_enabled === true;

    return (
        <div className="p-4 md:p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Settings size={18} className="text-amber-600" />
                </div>
                <div>
                    <h1 className="text-lg font-semibold text-stone-800">Configuración</h1>
                    <p className="text-xs text-stone-400">Personaliza la apariencia del sistema</p>
                </div>
            </div>

            {isReadOnly && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
                    Estás viendo la configuración en modo de solo lectura. Solo un Administrador puede modificarla.
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="flex gap-8 items-start">
                    <AdminNav sellByWeight={sellByWeight} printerVisible={printerVisible} />
                    <fieldset disabled={isReadOnly} className="flex-1 flex flex-col gap-5 min-w-0 border-0 p-0 m-0">
                        <div id="logo"><LogoSection config={config} /></div>
                        <div id="colores"><ColorsSection config={config} /></div>
                        <div id="negocio">
                            <FeatureSpotlight
                                featureKey={FeatureSpotlightKey.TicketSection}
                                title="Configuracion de impresora"
                                description="Descubre la nueva sección de configuración para tickets donde podrás personalizar y gestionar la apariencia de el ticket."
                                variant="block"
                                placement="top-start"
                            >

                                <BusinessInfoSection config={config} />
                            </FeatureSpotlight>
                        </div>
                        {printerVisible && (
                            <div id="impresora"><PrinterSection config={config} /></div>
                        )}
                        {sellByWeight && (
                            <div id="domicilio">
                                <DeliverySection config={config} />
                            </div>
                        )}
                        {sellByWeight && (
                            <div id="bascula"><ScaleSection /></div>
                        )}
                        <div id="menu">
                            <FeatureSpotlight
                                featureKey={FeatureSpotlightKey.OnlineMenuSection}
                                title="Sección de Menú"
                                description="Descubre la nueva sección de menú, donde podrás gestionar y visualizar toda la información de tus productos de manera eficiente."
                                variant="block"
                                placement="top-start"
                            >
                                <MenuSection config={config} />
                            </FeatureSpotlight>
                        </div>
                        <div id="menu-readonly">
                            <FeatureSpotlight
                                featureKey={FeatureSpotlightKey.ReadonlyMenuSection}
                                title="Menú de solo lectura"
                                description="Descarga un código QR para que tus clientes vean el menú sin poder hacer pedidos, ideal para imprimir y colocar en mesas."
                                variant="block"
                                placement="top-start"
                            >
                                <ReadonlyMenuQrSection config={config} />
                            </FeatureSpotlight>
                        </div>
                        <div id="proveedores">
                            <FeatureSpotlight
                                featureKey={FeatureSpotlightKey.ProvidersSettingsSection}
                                title="Sección de proveedores"
                                description="Activa o desactiva el registro de proveedores y compras para tu negocio."
                                variant="block"
                                placement="top-start"
                            >
                                <ProvidersSection config={config} />
                            </FeatureSpotlight>
                        </div>
                        <div id="empleados">
                            <FeatureSpotlight
                                featureKey={FeatureSpotlightKey.EmployeesSettingsSection}
                                title="Sección de empleados"
                                description="Activa o desactiva la administración de empleados para tu negocio."
                                variant="block"
                                placement="top-start"
                            >
                                <EmployeesSection config={config} />
                            </FeatureSpotlight>
                        </div>
                        <div id="permisos">
                            <FeatureSpotlight
                                featureKey={FeatureSpotlightKey.RolePermissions}
                                title="Roles y permisos"
                                description="Define qué puede hacer cada rol dentro del sistema"
                                variant="block"
                                placement="top-start"
                            >
                                <RolesPermissionsSection />
                            </FeatureSpotlight>
                        </div>
                        <div id="suscripcion">
                            <FeatureSpotlight
                                featureKey={FeatureSpotlightKey.SubscriptionSection}
                                title="Sección de Suscripción"
                                description="Descubre la nueva sección de suscripción, donde podrás gestionar y visualizar la información de tus planes y suscripciones de manera eficiente."
                                variant="block"
                                placement="top-start"
                            >
                                <SubscriptionInfoSection />
                            </FeatureSpotlight>
                        </div>
                    </fieldset>
                </div>
            )}
        </div>
    );
}

export default AdminPage;
