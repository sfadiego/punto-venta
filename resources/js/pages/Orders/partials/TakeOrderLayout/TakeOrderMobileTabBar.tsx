import { Package, ShoppingCart } from "lucide-react";

interface TakeOrderMobileTabBarProps {
    activeTab: "products" | "cart";
    cartCount: number;
    onTabChange: (tab: "products" | "cart") => void;
}

export const TakeOrderMobileTabBar = ({
    activeTab,
    cartCount,
    onTabChange,
}: TakeOrderMobileTabBarProps) => (
    <div className="bg-white border-t border-stone-200 flex flex-shrink-0 safe-area-bottom">
        <button
            onClick={() => onTabChange("products")}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors ${
                activeTab === "products" ? "text-amber-600" : "text-stone-400"
            }`}
        >
            <Package size={20} />
            Productos
        </button>
        <button
            onClick={() => onTabChange("cart")}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors relative ${
                activeTab === "cart" ? "text-amber-600" : "text-stone-400"
            }`}
        >
            <div className="relative">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                        {cartCount > 9 ? "9+" : cartCount}
                    </span>
                )}
            </div>
            Pedido
        </button>
    </div>
);
