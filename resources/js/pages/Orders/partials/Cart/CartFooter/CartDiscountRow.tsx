import { Tag, X } from "lucide-react";
import { useCartFooter } from "./useCartFooter";

interface CartDiscountRowProps {
    subtotal: number;
    orderDiscount: number;
    isReadOnly?: boolean;
    onUpdateDiscount: (descuento: number) => Promise<void>;
}

export const CartDiscountRow = ({
    subtotal,
    orderDiscount,
    isReadOnly = false,
    onUpdateDiscount,
}: CartDiscountRowProps) => {
    const {
        editing,
        setEditing,
        inputValue,
        setInputValue,
        inputRef,
        discountAmount,
        applyDiscount,
        handleKeyDown,
        clearDiscount,
    } = useCartFooter(orderDiscount, subtotal, onUpdateDiscount);

    return (
        <>
            <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500">Subtotal</span>
                <span className="text-stone-700 tabular-nums">${subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500 flex items-center gap-1.5">
                    <Tag size={13} />
                    Descuento
                </span>
                <div className="flex items-center gap-1.5">
                    {editing ? (
                        <div className="flex items-center gap-1">
                            <input
                                ref={inputRef}
                                type="number"
                                min={0}
                                max={99}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onBlur={applyDiscount}
                                onKeyDown={handleKeyDown}
                                placeholder="0"
                                className="w-14 text-right text-sm border border-amber-300 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white tabular-nums"
                            />
                            <span className="text-stone-500 text-xs">%</span>
                        </div>
                    ) : (
                        <>
                            {orderDiscount > 0 && (
                                <span className="text-emerald-600 tabular-nums text-xs">
                                    -${discountAmount.toFixed(2)}
                                </span>
                            )}
                            {!isReadOnly ? (
                                <button
                                    onClick={() => setEditing(true)}
                                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                        orderDiscount > 0
                                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                            : "bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-600"
                                    }`}
                                >
                                    {orderDiscount > 0 ? `${orderDiscount}%` : "Añadir %"}
                                </button>
                            ) : (
                                <span className="text-stone-400 tabular-nums">
                                    {orderDiscount > 0 ? `${orderDiscount}%` : "—"}
                                </span>
                            )}
                            {orderDiscount > 0 && !isReadOnly && (
                                <button
                                    onClick={clearDiscount}
                                    className="text-stone-300 hover:text-red-400 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};
