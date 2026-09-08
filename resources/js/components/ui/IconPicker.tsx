import {
    Apple,
    Award,
    Backpack,
    Balloon,
    Banana,
    Beef,
    Beer,
    Book,
    BottleWine,
    Cake,
    CakeSlice,
    Camera,
    Candy,
    CandyCane,
    Carrot,
    ChefHat,
    Cherry,
    Citrus,
    Coffee,
    Cookie,
    CreditCard,
    Croissant,
    CupSoda,
    Dices,
    Donut,
    Drumstick,
    Egg,
    EggFried,
    Fish,
    FishSymbol,
    Flame,
    Footprints,
    Gem,
    Gift,
    Glasses,
    Grape,
    Ham,
    Hamburger,
    Headphones,
    Heart,
    Home,
    IceCreamBowl,
    IceCreamCone,
    Key,
    Leaf,
    LeafyGreen,
    Lightbulb,
    Lock,
    Martini,
    Milk,
    Music,
    Package,
    PartyPopper,
    Pencil,
    Pizza,
    Popcorn,
    Puzzle,
    Refrigerator,
    Ribbon,
    Salad,
    Sandwich,
    Scissors,
    Shirt,
    ShoppingBag,
    ShoppingCart,
    Smartphone,
    Smile,
    Snowflake,
    Soup,
    Star,
    Store,
    Tag,
    ToyBrick,
    Umbrella,
    Utensils,
    UtensilsCrossed,
    Wallet,
    Watch,
    Wheat,
    Wine,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const COMMON_CATEGORY_ICONS: { name: string; Icon: LucideIcon }[] = [
    { name: "Apple", Icon: Apple },
    { name: "Award", Icon: Award },
    { name: "Backpack", Icon: Backpack },
    { name: "Balloon", Icon: Balloon },
    { name: "Banana", Icon: Banana },
    { name: "Beef", Icon: Beef },
    { name: "Beer", Icon: Beer },
    { name: "Book", Icon: Book },
    { name: "BottleWine", Icon: BottleWine },
    { name: "Cake", Icon: Cake },
    { name: "CakeSlice", Icon: CakeSlice },
    { name: "Camera", Icon: Camera },
    { name: "Candy", Icon: Candy },
    { name: "CandyCane", Icon: CandyCane },
    { name: "Carrot", Icon: Carrot },
    { name: "ChefHat", Icon: ChefHat },
    { name: "Cherry", Icon: Cherry },
    { name: "Citrus", Icon: Citrus },
    { name: "Coffee", Icon: Coffee },
    { name: "Cookie", Icon: Cookie },
    { name: "CreditCard", Icon: CreditCard },
    { name: "Croissant", Icon: Croissant },
    { name: "CupSoda", Icon: CupSoda },
    { name: "Dices", Icon: Dices },
    { name: "Donut", Icon: Donut },
    { name: "Drumstick", Icon: Drumstick },
    { name: "Egg", Icon: Egg },
    { name: "EggFried", Icon: EggFried },
    { name: "Fish", Icon: Fish },
    { name: "FishSymbol", Icon: FishSymbol },
    { name: "Flame", Icon: Flame },
    { name: "Footprints", Icon: Footprints },
    { name: "Gem", Icon: Gem },
    { name: "Gift", Icon: Gift },
    { name: "Glasses", Icon: Glasses },
    { name: "Grape", Icon: Grape },
    { name: "Ham", Icon: Ham },
    { name: "Hamburger", Icon: Hamburger },
    { name: "Headphones", Icon: Headphones },
    { name: "Heart", Icon: Heart },
    { name: "Home", Icon: Home },
    { name: "IceCreamBowl", Icon: IceCreamBowl },
    { name: "IceCreamCone", Icon: IceCreamCone },
    { name: "Key", Icon: Key },
    { name: "Leaf", Icon: Leaf },
    { name: "LeafyGreen", Icon: LeafyGreen },
    { name: "Lightbulb", Icon: Lightbulb },
    { name: "Lock", Icon: Lock },
    { name: "Martini", Icon: Martini },
    { name: "Milk", Icon: Milk },
    { name: "Music", Icon: Music },
    { name: "Package", Icon: Package },
    { name: "PartyPopper", Icon: PartyPopper },
    { name: "Pencil", Icon: Pencil },
    { name: "Pizza", Icon: Pizza },
    { name: "Popcorn", Icon: Popcorn },
    { name: "Puzzle", Icon: Puzzle },
    { name: "Refrigerator", Icon: Refrigerator },
    { name: "Ribbon", Icon: Ribbon },
    { name: "Salad", Icon: Salad },
    { name: "Sandwich", Icon: Sandwich },
    { name: "Scissors", Icon: Scissors },
    { name: "Shirt", Icon: Shirt },
    { name: "ShoppingBag", Icon: ShoppingBag },
    { name: "ShoppingCart", Icon: ShoppingCart },
    { name: "Smartphone", Icon: Smartphone },
    { name: "Smile", Icon: Smile },
    { name: "Snowflake", Icon: Snowflake },
    { name: "Soup", Icon: Soup },
    { name: "Star", Icon: Star },
    { name: "Store", Icon: Store },
    { name: "Tag", Icon: Tag },
    { name: "ToyBrick", Icon: ToyBrick },
    { name: "Umbrella", Icon: Umbrella },
    { name: "Utensils", Icon: Utensils },
    { name: "UtensilsCrossed", Icon: UtensilsCrossed },
    { name: "Wallet", Icon: Wallet },
    { name: "Watch", Icon: Watch },
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
