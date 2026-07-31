import { ShoppingCart, BarChart2, ShoppingBag, Zap } from "lucide-react";
import { AppThemeEnum } from "@/enums/AppThemeEnum";
import { AUTH_THEME_STYLES } from "@/enums/authThemeStyles";

const FEATURES = [
    { icon: ShoppingCart, label: "Punto de venta", desc: "Gestión rápida de pedidos y cobros" },
    { icon: ShoppingBag, label: "Control de ventas", desc: "Cortes de caja, historial y resúmenes" },
    { icon: BarChart2, label: "Estadísticas", desc: "Productos más vendidos y reportes" },
    { icon: Zap, label: "Multi-negocio", desc: "Restaurantes, carnicerías y más" },
];

interface BrandingPanelProps {
    appName: string;
    theme?: AppThemeEnum;
}

export const BrandingPanel = ({ appName, theme = AppThemeEnum.AmberOrange }: BrandingPanelProps) => {
    const styles = AUTH_THEME_STYLES[theme];

    return (
        <div className={`hidden lg:flex lg:w-1/2 ${styles.gradient} flex-col items-center justify-center p-12 relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full" />
                <div className="absolute bottom-16 right-12 w-72 h-72 bg-white rounded-full" />
                <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-white rounded-full" />
            </div>

            <div className="relative z-10 flex flex-col items-start max-w-sm w-full">
                <a
                    href="/landing/"
                    className="bg-white/20 backdrop-blur-sm rounded-3xl p-5 mb-8 shadow-xl inline-flex items-center justify-center"
                >
                    <img src="/images/logo-venta-rapida.png" alt={appName} className="w-12 h-12 object-contain" />
                </a>
                <h1 className="text-white text-4xl font-bold tracking-tight mb-3">{appName}</h1>
                <p className={`${styles.subtitleText} text-base leading-relaxed mb-10`}>
                    Sistema de punto de venta diseñado para negocios que quieren vender más y administrar mejor.
                </p>

                <div className="grid grid-cols-1 gap-4 w-full">
                    {FEATURES.map(({ icon: Icon, label, desc }) => (
                        <div key={label} className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                <Icon size={18} className="text-white" />
                            </div>
                            <div>
                                <p className="text-white text-sm font-semibold">{label}</p>
                                <p className={`${styles.featureDescText} text-xs`}>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
