import { Settings } from "lucide-react";
import { LogoSection } from "./partials/Logo/LogoSection";
import { ColorsSection } from "./partials/Colors/ColorsSection";
import { BusinessInfoSection } from "./partials/BusinessInfo/BusinessInfoSection";
import { PrinterSection } from "./partials/Printer/PrinterSection";
import { DeliverySection } from "./partials/Delivery/DeliverySection";
import { MenuSection } from "./partials/Menu/MenuSection";
import { AdminNav } from "./partials/AdminNav";
import { SubscriptionInfoSection } from "@/components/Admin/SubscriptionInfoSection";
import { useAdminPage } from "./useAdminPage";

function AdminPage() {
    const { config, isLoading, sellByWeight } = useAdminPage();
    const printerVisible = import.meta.env.VITE_APP_ENV === "local" || config?.printer_enabled === true;

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

            {isLoading ? (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="flex gap-8 items-start">
                    <AdminNav sellByWeight={sellByWeight} printerVisible={printerVisible} />
                    <div className="flex-1 flex flex-col gap-5 min-w-0">
                        <div id="logo"><LogoSection config={config} /></div>
                        <div id="colores"><ColorsSection config={config} /></div>
                        <div id="negocio"><BusinessInfoSection config={config} /></div>
                        {printerVisible && (
                            <div id="impresora"><PrinterSection config={config} /></div>
                        )}
                        {sellByWeight && (
                            <div id="domicilio"><DeliverySection config={config} /></div>
                        )}
                        <div id="menu"><MenuSection config={config} /></div>
                        <div id="suscripcion"><SubscriptionInfoSection /></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPage;
