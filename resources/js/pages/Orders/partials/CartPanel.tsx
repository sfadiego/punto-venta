import { Plus, Minus, Trash2, ShoppingCart, Tag, Loader, Banknote, Lock, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { IOrder } from "@/models/IOrder";
import { CartItem } from "../useTakeOrder";
import { usePayModal } from "./usePayModal";
import { PayModal } from "@/components/orders/PayModal";
import { PrintTicketButton } from "@/components/orders/PrintTicketButton";
import { CartItemNote } from "./CartItemNote";
import { usePermissions } from "@/hooks/usePermissions";

interface CartPanelProps {
    order: IOrder | undefined;
    cart: CartItem[];
    subtotal: number;
    orderDiscount: number;
    total: number;
    isLoading: boolean;
    isReadOnly?: boolean;
    onUpdate: (productId: number, delta: number) => void;
    onRemove: (orderProductId: number) => void;
    onNote: (orderProductId: number, note: string) => Promise<void>;
    onClear: () => void;
    onUpdateDiscount: (descuento: number) => Promise<void>;
    onUpdateProductDiscount: (productId: number, descuento: number) => Promise<void>;
}

export const CartPanel = ({ order, cart, subtotal, orderDiscount, total, isLoading, isReadOnly = false, onUpdate, onRemove, onNote, onClear, onUpdateDiscount, onUpdateProductDiscount }: CartPanelProps) => {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const { can } = usePermissions();
    const {
        isOpen: payOpen,
        cash,
        setCash,
        change,
        canPay,
        isPending,
        handleOpen: openPay,
        handleClose: closePay,
        handlePay,
    } = usePayModal(order?.id ?? 0, total);

    return (
        <>
            <div className="flex flex-col h-full bg-white">
                <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="font-semibold text-stone-900">
                            {order?.nombre_pedido ?? "Pedido"}
                        </h2>
                        <p className="text-stone-400 text-xs mt-0.5">
                            {isLoading
                                ? "Cargando..."
                                : cartCount === 0
                                  ? "Sin artículos"
                                  : `${cartCount} ${cartCount === 1 ? "artículo" : "artículos"}`}
                        </p>
                    </div>
                    {cart.length > 0 && !isReadOnly && (
                        <button
                            onClick={onClear}
                            className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-3">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-40 text-stone-400">
                            <Loader size={22} className="animate-spin" />
                        </div>
                    ) : cart.length === 0 ? (
                        <CartEmptyState />
                    ) : (
                        <div className="space-y-1">
                            {cart.map((item) => (
                                <CartItemRow
                                    key={item.orderProductId}
                                    item={item}
                                    isReadOnly={isReadOnly}
                                    onUpdate={onUpdate}
                                    onRemove={onRemove}
                                    onNote={onNote}
                                    onUpdateProductDiscount={onUpdateProductDiscount}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <CartFooter subtotal={subtotal} orderDiscount={orderDiscount} total={total} hasItems={cart.length > 0} isReadOnly={isReadOnly} orderId={order?.id ?? 0} canPay={can("payOrder")} onPay={openPay} onUpdateDiscount={onUpdateDiscount} />
            </div>

            <PayModal
                isOpen={payOpen}
                subtotal={subtotal}
                cash={cash}
                setCash={setCash}
                change={change}
                canPay={canPay}
                isPending={isPending}
                onPay={handlePay}
                onClose={closePay}
            />
        </>
    );
};

const CartEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full text-stone-400 py-12">
        <ShoppingCart size={38} className="mb-3 opacity-30" />
        <p className="text-sm font-medium">El pedido está vacío</p>
        <p className="text-xs mt-1 text-stone-400">Selecciona productos del menú</p>
    </div>
);

interface CartItemRowProps {
    item: CartItem;
    isReadOnly?: boolean;
    onUpdate: (productId: number, delta: number) => void;
    onRemove: (orderProductId: number) => void;
    onNote: (orderProductId: number, note: string) => Promise<void>;
    onUpdateProductDiscount: (productId: number, descuento: number) => Promise<void>;
}

const CartItemRow = ({ item, isReadOnly = false, onUpdate, onRemove, onNote, onUpdateProductDiscount }: CartItemRowProps) => {
    const [editingDiscount, setEditingDiscount] = useState(false);
    const [discountInput, setDiscountInput] = useState("");
    const discountInputRef = useRef<HTMLInputElement>(null);

    const itemTotal = item.price * item.quantity * (1 - item.descuento / 100);
    const canDiscount = !item.isExtra && item.id !== null;

    useEffect(() => {
        if (editingDiscount) {
            setDiscountInput(item.descuento > 0 ? String(item.descuento) : "");
            discountInputRef.current?.focus();
            discountInputRef.current?.select();
        }
    }, [editingDiscount, item.descuento]);

    const applyProductDiscount = async () => {
        const val = Math.min(99, Math.max(0, parseInt(discountInput) || 0));
        setEditingDiscount(false);
        if (val !== item.descuento && item.id !== null) await onUpdateProductDiscount(item.id, val);
    };

    const handleDiscountKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") applyProductDiscount();
        if (e.key === "Escape") setEditingDiscount(false);
    };

    const clearProductDiscount = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (item.id !== null) await onUpdateProductDiscount(item.id, 0);
    };

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
                        disabled={isReadOnly || item.isExtra}
                        className="w-7 h-7 rounded-lg bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                        <Minus size={12} className="text-stone-600" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-stone-900 tabular-nums">
                        {item.quantity}
                    </span>
                    <button
                        onClick={() => !item.isExtra && item.id !== null && onUpdate(item.id, 1)}
                        disabled={isReadOnly || item.isExtra}
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

interface CartFooterProps {
    subtotal: number;
    orderDiscount: number;
    total: number;
    hasItems: boolean;
    isReadOnly?: boolean;
    orderId: number;
    canPay: boolean;
    onPay: () => void;
    onUpdateDiscount: (descuento: number) => Promise<void>;
}

const CartFooter = ({ subtotal, orderDiscount, total, hasItems, isReadOnly = false, orderId, canPay, onPay, onUpdateDiscount }: CartFooterProps) => {
    const [editing, setEditing] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const discountAmount = subtotal - total;

    useEffect(() => {
        if (editing) {
            setInputValue(orderDiscount > 0 ? String(orderDiscount) : "");
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [editing, orderDiscount]);

    const applyDiscount = async () => {
        const val = Math.min(99, Math.max(0, parseInt(inputValue) || 0));
        setEditing(false);
        if (val !== orderDiscount) await onUpdateDiscount(val);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") applyDiscount();
        if (e.key === "Escape") setEditing(false);
    };

    const clearDiscount = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await onUpdateDiscount(0);
    };

    return (
        <div className="px-5 py-4 border-t border-stone-100 bg-stone-50 flex-shrink-0">
            <div className="space-y-2 mb-4">
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

                <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                    <span className="font-bold text-stone-900">Total</span>
                    <span className="font-bold text-stone-900 text-lg tabular-nums">
                        ${total.toFixed(2)}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                {isReadOnly ? (
                    <div className="w-full flex items-center justify-center gap-2 bg-stone-100 text-stone-400 font-medium py-3 rounded-xl text-sm cursor-not-allowed">
                        <Lock size={14} />
                        Orden cerrada
                    </div>
                ) : (
                    <button
                        onClick={onPay}
                        disabled={!hasItems || !canPay}
                        className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 disabled:bg-stone-200 disabled:text-stone-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors text-sm shadow-sm shadow-emerald-200"
                    >
                        <Banknote size={16} />
                        Pagar
                    </button>
                )}
                <PrintTicketButton
                    orderId={orderId}
                    showLabel
                    className="w-full flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 disabled:opacity-40 disabled:cursor-not-allowed text-stone-700 font-medium py-2.5 rounded-xl transition-colors text-sm"
                />
            </div>
        </div>
    );
};
