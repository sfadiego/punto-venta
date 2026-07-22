import { BarChart2, ShoppingBag, ShoppingCartIcon } from "lucide-react";
import { IBusinessConfig } from "@/models/IBusinessConfig";
import { ApisEnum } from "@/configs/apisEnum";
import { ApiRoutes } from "@/enums/ApiRoutesEnum";
import { BusinessLogo } from "@/components/BusinessLogo/BusinessLogo";
import { useNavigate } from "react-router-dom";

interface Props {
    tenant: IBusinessConfig | undefined;
    isLoading: boolean;
}

const features = [
    { icon: ShoppingCartIcon, label: "Gestión de pedidos" },
    { icon: ShoppingBag, label: "Control de ventas" },
    { icon: BarChart2, label: "Estadísticas" },
];

export const TenantSidePanel = ({ tenant, isLoading }: Props) => {
    const logoUrl = tenant?.logo_path
        ? `${ApisEnum.BaseUrl}${ApiRoutes.Files}/${tenant.logo_path}`
        : null;
    const logoIcon = tenant?.logo_icon ?? null;
    const navigate = useNavigate();
    return (
        <div
            className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
            style={{ backgroundColor: "var(--color-primary)" }}
        >
            {/* Círculos decorativos */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full" />
                <div className="absolute bottom-16 right-12 w-72 h-72 bg-white rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white rounded-full" />
            </div>

            <div className="relative z-10 flex flex-col items-center text-center max-w-xs">
                {/* Logo o ícono por defecto */}
                <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-7 mb-8 shadow-xl">
                    {isLoading ? (
                        <div className="w-14 h-14 rounded-full bg-white/30 animate-pulse" />
                    ) : (
                        <BusinessLogo
                            logoUrl={logoUrl}
                            logoIcon={logoIcon}
                            size={56}
                            imgClassName="w-14 h-14 object-contain rounded-xl cursor-pointer"
                            onClick={() => navigate('/auth')}
                        />
                    )}
                </div>

                <h1 onClick={() => navigate('/auth')} className="text-white text-4xl font-bold tracking-tight mb-3 cursor-pointer">
                    {isLoading ? (
                        <span className="inline-block w-36 h-9 bg-white/30 rounded-lg animate-pulse" />
                    ) : (
                        tenant?.business_name
                    )}
                </h1>

                <p className="text-white/80 text-base leading-relaxed mb-12">
                    Sistema de punto de venta para tu negocio
                </p>

                <div className="grid grid-cols-3 gap-5 w-full">
                    {features.map(({ icon: Icon, label }) => (
                        <div key={label} className="flex flex-col items-center gap-2.5">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Icon size={22} className="text-white" />
                            </div>
                            <span className="text-white/70 text-xs font-medium leading-tight text-center">
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
