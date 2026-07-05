import { Plus, Minus, Trash2, ShoppingCart, Tag, Loader, Banknote, Lock } from "lucide-react";
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
    isLoading: boolean;
    isReadOnly?: boolean;
    onUpdate: (productId: number, delta: number) => void;
    onRemove: (orderProductId: number) => void;
    onNote: (orderProductId: number, note: string) => Promise<void>;
    onClear: () => void;
}

export const CartPanel = ({ order, cart, subtotal, isLoading, isReadOnly = false, onUpdate, onRemove, onNote, onClear }: CartPanelProps) => {
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
    } = usePayModal(order?.id ?? 0, subtotal);

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
                                />
                            ))}
                        </div>
                    )}
                </div>

                <CartFooter subtotal={subtotal} hasItems={cart.length > 0} isReadOnly={isReadOnly} orderId={order?.id ?? 0} canPay={can("payOrder")} onPay={openPay} />
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
}

const CartItemRow = ({ item, isReadOnly = false, onUpdate, onRemove, onNote }: CartItemRowProps) => (
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
                <p className="text-stone-400 text-xs">${item.price.toFixed(2)} c/u</p>
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
                ${(item.price * item.quantity).toFixed(2)}
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

interface CartFooterProps {
    subtotal: number;
    hasItems: boolean;
    isReadOnly?: boolean;
    orderId: number;
    canPay: boolean;
    onPay: () => void;
}

const CartFooter = ({ subtotal, hasItems, isReadOnly = false, orderId, canPay, onPay }: CartFooterProps) => (
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
                <span className="text-stone-700">$0.00</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                <span className="font-bold text-stone-900">Total</span>
                <span className="font-bold text-stone-900 text-lg tabular-nums">
                    ${subtotal.toFixed(2)}
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
