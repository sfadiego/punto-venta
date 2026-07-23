import { Settings2 } from "lucide-react";
import { SuperAdminLayout } from "@/layouts/SuperAdminLayout";
import { useSettingsPage } from "./useSettingsPage";
import { LogoUploadSection } from "./partials/LogoUploadSection";
import { PrinterAgentSection } from "./partials/PrinterAgentSection";
import { PaymentInfoForm } from "./partials/PaymentInfoForm";

export default function SettingsPage() {
    const { settings, isLoading, saving, toggleLogoUpload, paymentFormik } = useSettingsPage();

    return (
        <SuperAdminLayout>
            <div className="px-6 py-6 max-w-2xl mx-auto flex flex-col gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center">
                        <Settings2 size={18} className="text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Configuración global</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Opciones que aplican a todos los clientes</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-16">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        <LogoUploadSection
                            enabled={!!settings?.logo_upload_enabled}
                            saving={saving}
                            onToggle={toggleLogoUpload}
                        />

                        <PrinterAgentSection />

                        <PaymentInfoForm formik={paymentFormik} />
                    </>
                )}
            </div>
        </SuperAdminLayout>
    );
}
