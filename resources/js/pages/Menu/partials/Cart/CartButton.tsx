import { ShoppingCart } from "lucide-react";

interface CartButtonProps {
    count: number;
    total: number;
    primaryColor: string;
    onClick: () => void;
}

export const CartButton = ({ count, total, primaryColor, onClick }: CartButtonProps) => {
    if (count === 0) return null;

    return (
        <div
            className="shrink-0 px-4 bg-stone-50 border-t border-stone-100"
            style={{ paddingTop: "12px", paddingBottom: "max(16px, env(safe-area-inset-bottom, 16px))" }}
        >
            <button
                onClick={onClick}
                className="flex items-center gap-3 px-5 py-4 rounded-2xl text-white w-full max-w-lg mx-auto active:opacity-80 transition-opacity"
                style={{
                    backgroundColor: primaryColor,
                    boxShadow: `0 4px 16px ${primaryColor}44`,
                }}
            >
                <div className="relative shrink-0">
                    <ShoppingCart size={22} />
                    <span
                        className="absolute -top-2 -right-2 w-5 h-5 bg-white rounded-full text-xs font-bold flex items-center justify-center tabular-nums"
                        style={{ color: primaryColor }}
                    >
                        {count}
                    </span>
                </div>
                <span className="flex-1 text-left text-sm font-semibold">Ver pedido</span>
                <span className="text-sm font-bold tabular-nums">${total.toFixed(2)}</span>
            </button>
        </div>
    );
};
