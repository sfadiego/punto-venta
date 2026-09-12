import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { ChevronDown, LucideIcon } from "lucide-react";

interface SidebarNavDropdownChild {
    label: string;
    icon: LucideIcon;
    path: string;
}

interface SidebarNavDropdownProps {
    label: string;
    icon: LucideIcon;
    items: SidebarNavDropdownChild[];
    onItemClick: () => void;
}

// Agrupa opciones secundarias del sidebar (Estadísticas/Inventario/Usuarios/Configuración)
// bajo un único dropdown. `open` es la única fuente de verdad para renderizar — así el botón
// de toggle siempre funciona, incluso parado en una de las páginas hijas. El efecto solo
// auto-abre el grupo al NAVEGAR hacia una hija (recargar en /statistics no debe dejarlo
// colapsado con el item activo oculto), nunca lo fuerza a quedarse abierto después.
export function SidebarNavDropdown({ label, icon: Icon, items, onItemClick }: SidebarNavDropdownProps) {
    const location = useLocation();
    const hasActiveChild = items.some((item) => location.pathname === item.path);
    const [open, setOpen] = useState(hasActiveChild);

    useEffect(() => {
        if (hasActiveChild) setOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-expanded={open}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 hover:bg-white/10"
                style={{ color: "color-mix(in srgb, var(--color-font) 65%, transparent)" }}
            >
                <Icon size={18} />
                <span className="flex-1 text-left">{label}</span>
                <ChevronDown size={15} className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
            </button>

            {/* Truco grid-template-rows 0fr↔1fr: anima la altura real del contenido sin medir
                el DOM (no se puede animar "height: auto" con CSS puro). Los hijos siempre están
                montados — overflow-hidden los recorta a 0 cuando la fila colapsa — así la
                transición corre completa en ambos sentidos en vez de aparecer/desaparecer de golpe. */}
            <div
                className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
            >
                <div className="overflow-hidden">
                    <div className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                        {items.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onItemClick}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 hover:bg-white/10"
                                style={({ isActive }) =>
                                    isActive
                                        ? { backgroundColor: "var(--color-primary)", color: "var(--color-font)" }
                                        : { color: "color-mix(in srgb, var(--color-font) 65%, transparent)" }
                                }
                            >
                                <item.icon size={16} />
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
