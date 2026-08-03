import {
    Coffee,
    Pizza,
    Sandwich,
    IceCreamCone,
    Beer,
    Wine,
    Cake,
    Soup,
    Cookie,
    Utensils,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const COMMON_CATEGORY_ICONS: { name: string; Icon: LucideIcon }[] = [
    { name: "Coffee", Icon: Coffee },
    { name: "Pizza", Icon: Pizza },
    { name: "Sandwich", Icon: Sandwich },
    { name: "IceCreamCone", Icon: IceCreamCone },
    { name: "Beer", Icon: Beer },
    { name: "Wine", Icon: Wine },
    { name: "Cake", Icon: Cake },
    { name: "Soup", Icon: Soup },
    { name: "Cookie", Icon: Cookie },
    { name: "Utensils", Icon: Utensils },
];

interface IconPickerProps {
    value: string;
    onSelect: (name: string) => void;
}

export const IconPicker = ({ value, onSelect }: IconPickerProps) => (
    <div className="grid grid-cols-5 gap-2">
        {COMMON_CATEGORY_ICONS.map(({ name, Icon }) => {
            const isSelected = value === name;

            return (
                <button
                    key={name}
                    type="button"
                    onClick={() => onSelect(name)}
                    title={name}
                    className={`aspect-square rounded-xl border flex items-center justify-center transition-colors ${
                        isSelected
                            ? "border-amber-500 bg-amber-100 text-amber-600"
                            : "border-stone-200 bg-stone-50 text-stone-500 hover:bg-stone-100"
                    }`}
                >
                    <Icon size={18} />
                </button>
            );
        })}
    </div>
);
