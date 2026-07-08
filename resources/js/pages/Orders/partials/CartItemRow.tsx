import { Plus, Minus, Trash2, Tag, X, Loader } from "lucide-react";
import { CartItem } from "../useTakeOrder";
import { CartItemNote } from "./CartItemNote";
import { useCartItemRow } from "./useCartItemRow";

interface CartItemRowProps {
    item: CartItem;
    isReadOnly?: boolean;
    isPending?: boolean;
    onUpdate: (productId: number, delta: number) => void;
    onRemove: (orderProductId: number) => void;
    onNote: (orderProductId: number, note: string) => Promise<void>;
    onUpdateProductDiscount: (productId: number, descuento: number) => Promise<void>;
}

export const CartItemRow = ({
    item,
    isReadOnly = false,
    isPending = false,
    onUpdate,
    onRemove,
    onNote,
    onUpdateProductDiscount,
}: CartItemRowProps) => {
    const {
        editingDiscount,
        setEditingDiscount,
        discountInput,
        setDiscountInput,
        discountInputRef,
        itemTotal,
        canDiscount,
        applyProductDiscount,
        handleDiscountKeyDown,
        clearProductDiscount,
    } = useCartItemRow(item, onUpdateProductDiscount);

    return (
        <div className="py-3 border-b border-stone-100 last:border-0">
            <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p className="text-stone-900 text-sm font-medium truncate">{item.name}</p>
                        {item.isExtra && (
                            <span className="shrink-0 text-xs font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600">
                                Extra
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <p className={`text-xs tabular-nums ${item.descuento > 0 ? "line-through text-stone-300" : "text-stone-400"}`}>
                            ${item.price.toFixed(2)} c/u
                        </p>
                        {item.descuento > 0 && (
                            <p className="text-xs text-emerald-600 tabular-nums">
                                ${(item.price * (1 - item.descuento / 100)).toFixed(2)} c/u
                            </p>
                        )}
                        {canDiscount && !isReadOnly && (
                            editingDiscount ? (
                                <div className="flex items-center gap-0.5">
                                    <input
                                        ref={discountInputRef}
                                        type="number"
                                        min={0}
                                        max={99}
                                        value={discountInput}
                                        onChange={(e) => setDiscountInput(e.target.value)}
                                        onBlur={applyProductDiscount}
                                        onKeyDown={handleDiscountKeyDown}
                                        placeholder="0"
                                        className="w-10 text-right text-xs border border-amber-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-amber-400 bg-white tabular-nums"
                                    />
                                    <span className="text-stone-400 text-xs">%</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-0.5">
                                    <button
                                        onClick={() => setEditingDiscount(true)}
                                        className={`text-xs px-1.5 py-0.5 rounded-full font-medium transition-colors ${
                                            item.descuento > 0
                                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                                                : "text-stone-300 hover:text-stone-500"
                                        }`}
                                    >
                                        {item.descuento > 0 ? `${item.descuento}%` : <Tag size={10} />}
                                    </button>
                                    {item.descuento > 0 && (
                                        <button
                                            onClick={clearProductDiscount}
                                            className="text-stone-300 hover:text-red-400 transition-colors"
                                        >
                                            <X size={10} />
                                        </button>
                                    )}
                                </div>
                            )
                        )}
                        {canDiscount && isReadOnly && item.descuento > 0 && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                                {item.descuento}%
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => !item.isExtra && item.id !== null && onUpdate(item.id, -1)}
                        disabled={isReadOnly || item.isExtra || isPending}
                        className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                        <Minus size={12} className="text-stone-600" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-stone-900 tabular-nums">
                        {isPending ? <Loader size={12} className="animate-spin text-amber-500 mx-auto" /> : item.quantity}
                    </span>
                    <button
                        onClick={() => !item.isExtra && item.id !== null && onUpdate(item.id, 1)}
                        disabled={isReadOnly || item.isExtra || isPending}
                        className="w-7 h-7 rounded-lg bg-amber-100 hover:bg-amber-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                        <Plus size={12} className="text-amber-700" />
                    </button>
                </div>
                <div className="flex items-center gap-2 ml-1">
                    <span className="text-stone-900 font-semibold text-sm w-16 text-right tabular-nums">
                        ${itemTotal.toFixed(2)}
                    </span>
                    {!isReadOnly && (
                        <button
                            onClick={() => onRemove(item.orderProductId)}
                            className="text-stone-300 hover:text-red-400 transition-colors"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}
                    {isReadOnly && <div className="w-[14px]" />}
                </div>
            </div>
            <CartItemNote
                observacion={item.observacion}
                isReadOnly={isReadOnly}
                onSave={(note) => onNote(item.orderProductId, note)}
            />
        </div>
    );
};
