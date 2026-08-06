import { Activity, AlertTriangle, Building2, CreditCard, Palette, Printer, Sparkles, Truck, UserPlus, Users } from "lucide-react";

const BASE_SECTIONS = [
    { id: "negocio", label: "Negocio", icon: <Building2 size={18} /> },
    { id: "colores", label: "Colores", icon: <Palette size={18} /> },
];

const CREATE_SECTION = { id: "admin", label: "Administrador", icon: <UserPlus size={18} /> };

const EDIT_SECTIONS = [
    { id: "limite", label: "Límite de usuarios", icon: <Users size={18} /> },
    { id: "suscripcion", label: "Suscripción", icon: <CreditCard size={18} /> },
    { id: "impresora", label: "Impresora", icon: <Printer size={18} /> },
    { id: "proveedores-empleados", label: "Proveedores y empleados", icon: <Truck size={18} /> },
    { id: "actividad", label: "Actividad", icon: <Activity size={18} /> },
    { id: "novedades", label: "Novedades", icon: <Sparkles size={18} /> },
];

const DANGER_SECTION = { id: "peligro", label: "Zona de peligro", icon: <AlertTriangle size={18} /> };

interface TenantFormNavProps {
    isEdit: boolean;
    showDangerZone?: boolean;
}

export const TenantFormNav = ({ isEdit, showDangerZone = false }: TenantFormNavProps) => {
    let sections = isEdit ? [...BASE_SECTIONS, ...EDIT_SECTIONS] : [...BASE_SECTIONS, CREATE_SECTION];
    if (isEdit && showDangerZone) sections = [...sections, DANGER_SECTION];

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    return (
        <nav className="hidden lg:flex flex-col gap-1 w-48 shrink-0 pt-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                Secciones
            </p>
            {sections.map((s) => (
                <button
                    key={s.id}
                    type="button"
                    onClick={() => scrollTo(s.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                        s.id === "peligro"
                            ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                            : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                >
                    <span className={s.id === "peligro" ? "text-red-400" : "text-slate-400"}>{s.icon}</span>
                    {s.label}
                </button>
            ))}
        </nav>
    );
};
