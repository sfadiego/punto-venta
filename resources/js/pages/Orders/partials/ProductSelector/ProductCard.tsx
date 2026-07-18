import { Loader, Package } from "lucide-react";
import { IProduct } from "@/models/IProduct";
import { CartItem } from "../../useTakeOrder";

interface ProductCardProps {
    product: IProduct;
    cartItem: CartItem | undefined;
    isReadOnly?: boolean;
    isPending?: boolean;
    onAdd: (productId: number, name: string, price: number) => void;
}

export const ProductCard = ({
    product,
    cartItem,
    isReadOnly = false,
    isPending = false,
    onAdd,
}: ProductCardProps) => {
    const disabled = isReadOnly || isPending;

    return (
        <button
            onClick={() => !disabled && onAdd(product.id, product.nombre, product.precio)}
            disabled={disabled}
            className={`relative bg-white rounded-xl border-2 p-4 text-left transition-all duration-150 ${
                isReadOnly
                    ? "border-stone-100 opacity-70 cursor-not-allowed"
                    : isPending
                      ? "border-amber-300 opacity-70 cursor-wait"
                      : cartItem
                        ? "border-amber-400 shadow-sm hover:shadow-md active:scale-95"
                        : "border-stone-100 hover:border-amber-200 hover:shadow-md active:scale-95"
            }`}
        >
            {cartItem && !isPending && (
                <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 bg-amber-500 text-white rounded-full text-xs flex items-center justify-center font-bold leading-none shadow-sm">
                    {cartItem.quantity}
                </span>
            )}
            {isPending && (
                <span className="absolute -top-2 -right-2 w-[22px] h-[22px] bg-amber-400 text-white rounded-full flex items-center justify-center shadow-sm">
                    <Loader size={12} className="animate-spin" />
                </span>
            )}
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center mb-2">
                <Package size={16} className="text-amber-500" />
            </div>
            <p className="text-stone-900 font-medium text-sm leading-tight">{product.nombre}</p>
            <p className="text-amber-600 font-bold text-sm mt-1">${product.precio}</p>
        </button>
    );
};
