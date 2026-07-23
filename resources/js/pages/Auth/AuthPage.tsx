import { ShoppingCart } from "lucide-react";
import { useAuthPage } from "./useAuthPage";
import { BrandingPanel } from "./partials/BrandingPanel";
import { ClientAccessForm } from "./partials/ClientAccessForm";
import { DemoRequestForm } from "./partials/DemoRequestForm";
import { DemoRequestSuccess } from "./partials/DemoRequestSuccess";

export default function AuthPage() {
    const appName = import.meta.env.VITE_APP_NAME;
    const { slug, setSlug, goToClientAuth, demoFormik, isSubmittingDemo, submitted } = useAuthPage();

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            <BrandingPanel appName={appName} />

            {/* Panel derecho — acciones */}
            <div className="flex-1 flex items-center justify-center p-6 bg-white">
                <div className="w-full max-w-sm space-y-8">
                    {/* Logo mobile */}
                    <div className="lg:hidden flex justify-center">
                        <div className="bg-amber-500 rounded-2xl p-4 shadow-lg">
                            <ShoppingCart size={36} className="text-white" />
                        </div>
                    </div>

                    <ClientAccessForm slug={slug} setSlug={setSlug} onSubmit={goToClientAuth} />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-stone-100" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="px-3 bg-white text-xs text-stone-400">¿No tienes cuenta?</span>
                        </div>
                    </div>

                    {submitted ? (
                        <DemoRequestSuccess />
                    ) : (
                        <DemoRequestForm formik={demoFormik} isSubmitting={isSubmittingDemo} />
                    )}

                    <p className="text-center text-stone-300 text-xs">
                        {appName} &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}
