import { useParams, Navigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { TenantSidePanel } from "@/components/auth/TenantSidePanel";
import { BusinessLogo } from "@/components/BusinessLogo/BusinessLogo";
import { useTenantLoginPage } from "./useTenantLoginPage";
import { ApisEnum } from "@/configs/apisEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";

export default function TenantLoginPage() {
    const { slug } = useParams<{ slug: string }>();
    const { tenant, isLoading, isError, isInactive } = useTenantLoginPage(slug ?? "");

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50">
                <div className="w-8 h-8 rounded-full border-4 border-stone-200 border-t-stone-500 animate-spin" />
            </div>
        );
    }

    if (isError && !isInactive) {
        return <Navigate to="/login" replace />;
    }

    if (isInactive) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
                <div className="bg-white rounded-2xl border border-amber-200 shadow-sm p-8 max-w-sm w-full text-center">
                    <div className="flex justify-center mb-4">
                        <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center">
                            <AlertTriangle size={28} className="text-amber-500" />
                        </div>
                    </div>
                    <h2 className="text-lg font-semibold text-stone-900 mb-2">
                        Servicio no disponible
                    </h2>
                    <p className="text-stone-500 text-sm leading-relaxed">
                        Este negocio ha sido desactivado temporalmente.
                        <br />
                        Contacta al administrador para más información.
                    </p>
                </div>
            </div>
        );
    }

    const logoUrl = tenant?.logo_path
        ? `${ApisEnum.BaseUrl}${ApiRoutes.Files}/${tenant.logo_path}`
        : null;

    return (
        <div className="min-h-screen flex">
            <TenantSidePanel tenant={tenant} isLoading={isLoading} />

            <div className="flex-1 flex items-center justify-center p-6 bg-white">
                <div className="w-full max-w-sm">
                    {/* Icono/logo visible en mobile */}
                    <div className="lg:hidden flex justify-center mb-8">
                        <div
                            className="rounded-2xl p-4 shadow-lg"
                            style={{ backgroundColor: "var(--color-primary)" }}
                        >
                            <BusinessLogo
                                logoUrl={logoUrl}
                                logoIcon={tenant?.logo_icon ?? null}
                                size={36}
                                imgClassName="w-9 h-9 object-contain"
                            />
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2
                            className="text-2xl font-bold"
                            style={{ color: "var(--color-label)" }}
                        >
                            Bienvenido
                        </h2>
                        <p className="text-stone-500 text-sm mt-1">
                            {isLoading
                                ? "Cargando..."
                                : `Inicia sesión en ${tenant?.business_name ?? ""}`}
                        </p>
                    </div>

                    <LoginForm />

                    <p className="text-center text-stone-400 text-xs mt-10">
                        {tenant?.business_name} &copy;{" "}
                        {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}
