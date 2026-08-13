import {
    Apple,
    Banana,
    Beef,
    Beer,
    BottleWine,
    Cake,
    CakeSlice,
    Candy,
    CandyCane,
    Carrot,
    ChefHat,
    Cherry,
    Citrus,
    Coffee,
    Cookie,
    Croissant,
    CupSoda,
    Donut,
    Drumstick,
    Egg,
    EggFried,
    Fish,
    FishSymbol,
    Flame,
    Gift,
    Grape,
    Ham,
    Hamburger,
    IceCreamBowl,
    IceCreamCone,
    Leaf,
    LeafyGreen,
    Martini,
    Milk,
    Pizza,
    Popcorn,
    Refrigerator,
    Salad,
    Sandwich,
    ShoppingBag,
    ShoppingCart,
    Snowflake,
    Soup,
    Store,
    Tag,
    Utensils,
    UtensilsCrossed,
    Wheat,
    Wine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const COMMON_CATEGORY_ICONS: { name: string; Icon: LucideIcon }[] = [
    { name: "Apple", Icon: Apple },
    { name: "Banana", Icon: Banana },
    { name: "Beef", Icon: Beef },
    { name: "Beer", Icon: Beer },
    { name: "BottleWine", Icon: BottleWine },
    { name: "Cake", Icon: Cake },
    { name: "CakeSlice", Icon: CakeSlice },
    { name: "Candy", Icon: Candy },
    { name: "CandyCane", Icon: CandyCane },
    { name: "Carrot", Icon: Carrot },
    { name: "ChefHat", Icon: ChefHat },
    { name: "Cherry", Icon: Cherry },
    { name: "Citrus", Icon: Citrus },
    { name: "Coffee", Icon: Coffee },
    { name: "Cookie", Icon: Cookie },
    { name: "Croissant", Icon: Croissant },
    { name: "CupSoda", Icon: CupSoda },
    { name: "Donut", Icon: Donut },
    { name: "Drumstick", Icon: Drumstick },
    { name: "Egg", Icon: Egg },
    { name: "EggFried", Icon: EggFried },
    { name: "Fish", Icon: Fish },
    { name: "FishSymbol", Icon: FishSymbol },
    { name: "Flame", Icon: Flame },
    { name: "Gift", Icon: Gift },
    { name: "Grape", Icon: Grape },
    { name: "Ham", Icon: Ham },
    { name: "Hamburger", Icon: Hamburger },
    { name: "IceCreamBowl", Icon: IceCreamBowl },
    { name: "IceCreamCone", Icon: IceCreamCone },
    { name: "Leaf", Icon: Leaf },
    { name: "LeafyGreen", Icon: LeafyGreen },
    { name: "Martini", Icon: Martini },
    { name: "Milk", Icon: Milk },
    { name: "Pizza", Icon: Pizza },
    { name: "Popcorn", Icon: Popcorn },
    { name: "Refrigerator", Icon: Refrigerator },
    { name: "Salad", Icon: Salad },
    { name: "Sandwich", Icon: Sandwich },
    { name: "ShoppingBag", Icon: ShoppingBag },
    { name: "ShoppingCart", Icon: ShoppingCart },
    { name: "Snowflake", Icon: Snowflake },
    { name: "Soup", Icon: Soup },
    { name: "Store", Icon: Store },
    { name: "Tag", Icon: Tag },
    { name: "Utensils", Icon: Utensils },
    { name: "UtensilsCrossed", Icon: UtensilsCrossed },
    { name: "Wheat", Icon: Wheat },
    { name: "Wine", Icon: Wine },
];

interface IconPickerProps {
    value: string;
    search?: string;
    onSelect: (name: string) => void;
}

export const IconPicker = ({ value, search = "", onSelect }: IconPickerProps) => {
    const query = search.trim().toLowerCase();
    const icons = query
        ? COMMON_CATEGORY_ICONS.filter(({ name }) => name.toLowerCase().includes(query))
        : COMMON_CATEGORY_ICONS;

    if (icons.length === 0) {
        return <p className="text-sm text-stone-400 text-center py-6">Sin resultados para &quot;{search}&quot;</p>;
    }

    return (
        <div className="grid grid-cols-4 gap-2.5">
            {icons.map(({ name, Icon }) => {
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
                        <Icon size={28} />
                    </button>
                );
            })}
        </div>
    );
};
