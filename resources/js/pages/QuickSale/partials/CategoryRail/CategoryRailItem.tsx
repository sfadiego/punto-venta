import { ReactNode } from "react";

interface CategoryRailItemProps {
    label: string;
    icon: ReactNode;
    isActive: boolean;
    onSelect: () => void;
}

export const CategoryRailItem = ({ label, icon, isActive, onSelect }: CategoryRailItemProps) => (
    <button
        type="button"
        onClick={onSelect}
        className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-center transition-colors ${
            isActive ? "text-white shadow-sm" : "text-stone-500 hover:bg-stone-100 hover:text-stone-700"
        }`}
        style={isActive ? { backgroundColor: "var(--color-primary)" } : undefined}
    >
        {/* Sin el texto debajo (oculto hasta md:), el ícono queda chico dentro del mismo
            ancho de botón — se agranda con scale en vez de tocar CatalogIcon, así funciona
            igual para íconos Lucide (svg) y OpenMoji (img con tamaño inline). */}
        <span className="inline-flex scale-125 md:scale-100 transition-transform">{icon}</span>
        <span className="hidden md:inline text-[11px] font-semibold leading-tight">{label}</span>
    </button>
);
