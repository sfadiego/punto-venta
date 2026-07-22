import { Bike, CreditCard, Globe, Image, Lock, Palette, Phone, Printer } from "lucide-react";

const BASE_SECTIONS = [
    { id: "logo",         label: "Logo",             icon: <Image size={20} /> },
    { id: "colores",      label: "Colores",          icon: <Palette size={20} /> },
    { id: "negocio",      label: "Info del negocio", icon: <Phone size={20} /> },
    { id: "menu",         label: "Pedidos en línea", icon: <Globe size={20} /> },
    { id: "suscripcion",  label: "Suscripción",      icon: <CreditCard size={20} /> },
];

const DELIVERY_SECTION = { id: "domicilio", label: "Domicilio", icon: <Bike size={14} /> };

interface AdminNavProps {
    sellByWeight?: boolean;
    printerVisible?: boolean;
}

export const AdminNav = ({ sellByWeight, printerVisible = false }: AdminNavProps) => {
    const sections = sellByWeight ? [...BASE_SECTIONS, DELIVERY_SECTION] : BASE_SECTIONS;

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <nav className="hidden lg:flex flex-col gap-1 w-44 shrink-0 pt-1">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider px-2 mb-1">
                Secciones
            </p>
            {sections.map((s) => (
                <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors text-left"
                >
                    <span className="text-stone-400">{s.icon}</span>
                    {s.label}
                </button>
            ))}

            {printerVisible ? (
                <button
                    onClick={() => scrollTo("impresora")}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-stone-500 hover:text-stone-800 hover:bg-stone-100 transition-colors text-left"
                >
                    <span className="text-stone-400"><Printer size={20} /></span>
                    Impresora
                </button>
            ) : (
                <div
                    title="Actívalo desde el panel de SuperAdmin"
                    className="flex items-start gap-2.5 px-3 py-2 rounded-lg cursor-default"
                >
                    <span className="text-stone-300 mt-0.5"><Printer size={20} /></span>
                    <div>
                        <p className="text-sm text-stone-300">Impresora</p>
                        <p className="text-xs text-stone-300 flex items-center gap-1 mt-0.5">
                            <Lock size={10} />
                            SuperAdmin
                        </p>
                    </div>
                </div>
            )}
        </nav>
    );
};
