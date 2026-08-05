import {
    Coffee,
    Utensils,
    ShoppingCart,
    ChefHat,
    Pizza,
    Sandwich,
    type LucideIcon,
    Beef,
    Beer,
    Store,
    Hamburger,
} from "lucide-react";

export interface IconOption {
    name: string;
    label: string;
    component: LucideIcon;
}

export const BUSINESS_ICONS: IconOption[] = [
    { name: "Beef", label: "Carnes", component: Beef },
    { name: "Coffee", label: "Café", component: Coffee },
    { name: "Utensils", label: "Restaurante", component: Utensils },
    { name: "Beer", label: "Bar", component: Beer },
    { name: "Hamburger", label: "Hamburguesas", component: Hamburger },
    { name: "ShoppingCart", label: "Mercado", component: ShoppingCart },
    { name: "ChefHat", label: "Chef", component: ChefHat },
    { name: "Pizza", label: "Pizzería", component: Pizza },
    { name: "Sandwich", label: "Pastelería", component: Sandwich },
    { name: "Store", label: "Mercado", component: Store },
];

interface IconSelectorProps {
    selected: string | null;
    saving: boolean;
    onSelect: (iconName: string) => void;
}

export function IconSelector({ selected, saving, onSelect }: IconSelectorProps) {
    return (
        <div className="mt-5">
            <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-3">
                Seleccionar icono predefinido
            </p>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                {BUSINESS_ICONS.map(({ name, label, component: Icon }) => {
                    const isSelected = selected === name;
                    return (
                        <button
                            key={name}
                            type="button"
                            onClick={() => onSelect(name)}
                            disabled={saving}
                            title={label}
                            className={`flex flex-col items-center gap-1.5 p-2 sm:p-3 rounded-xl border-2 transition-all text-xs font-medium disabled:opacity-50
                                ${isSelected
                                    ? "border-amber-500 bg-amber-50 text-amber-700"
                                    : "border-stone-200 bg-white text-stone-500 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
                                }`}
                        >
                            <Icon size={22} />
                            <span className="hidden sm:inline leading-none">{label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
