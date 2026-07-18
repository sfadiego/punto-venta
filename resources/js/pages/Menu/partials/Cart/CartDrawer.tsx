import { X, ShoppingCart } from "lucide-react";
import { ICartItem, IMenuProduct } from "@/models/IMenu";
import { CartItem } from "./CartItem";

interface CartDrawerProps {
    open: boolean;
    items: ICartItem[];
    total: number;
    primaryColor: string;
    onClose: () => void;
    onAdd: (product: IMenuProduct) => void;
    onRemove: (productId: number) => void;
    onDelete: (productId: number) => void;
    onSetWeight: (productId: number, weight: number) => void;
    onNote: (productId: number, note: string) => void;
    onCheckout: () => void;
}

export const CartDrawer = ({
    open,
    items,
    total,
    primaryColor,
    onClose,
    onAdd,
    onRemove,
    onDelete,
    onSetWeight,
    onNote,
    onCheckout,
}: CartDrawerProps) => (
    <>
        <div
            className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
                open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            }`}
            onClick={onClose}
        />

        <div
            className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out flex flex-col ${
                open ? "translate-y-0" : "translate-y-full"
            }`}
            style={{ maxHeight: "85vh" }}
        >
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mt-3 shrink-0" />

            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-stone-100 shrink-0">
                <div className="flex items-center gap-2">
                    <ShoppingCart size={16} className="text-stone-500" />
                    <span className="text-sm font-semibold text-stone-800">Tu pedido</span>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-lg hover:bg-stone-100 active:bg-stone-200 transition-colors flex items-center justify-center"
                >
                    <X size={16} className="text-stone-500" />
                </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
                {items.map((item) => (
                    <CartItem
                        key={item.product.id}
                        item={item}
                        primaryColor={primaryColor}
                        onAdd={onAdd}
                        onRemove={onRemove}
                        onDelete={onDelete}
                        onSetWeight={onSetWeight}
                        onNote={onNote}
                    />
                ))}
            </div>

            <div
                className="px-5 pt-4 border-t border-stone-100 shrink-0"
                style={{ paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))" }}
            >
                <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-stone-500">Total estimado</span>
                    <span className="text-base font-bold text-stone-800 tabular-nums">
                        ${total.toFixed(2)}
                    </span>
                </div>
                <button
                    onClick={() => { onClose(); onCheckout(); }}
                    className="w-full py-4 rounded-2xl text-white text-sm font-semibold transition-opacity active:opacity-80"
                    style={{ backgroundColor: primaryColor }}
                >
                    Confirmar pedido
                </button>
            </div>
        </div>
    </>
);
