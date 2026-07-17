import { Loader } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { CartItem } from "../useTakeOrder";
import { usePayModal } from "./usePayModal";
import { RestaurantPayModal } from "@/components/orders/RestaurantPayModal";
import { CartEmptyState } from "./CartEmptyState";
import { CartItemRow } from "./CartItemRow";
import { CartFooter } from "./CartFooter";
import { usePermissions } from "@/hooks/usePermissions";

interface CartPanelProps {
    order: IOrder | undefined;
    cart: CartItem[];
    subtotal: number;
    orderDiscount: number;
    total: number;
    isLoading: boolean;
    isReadOnly?: boolean;
    pendingProductIds?: Set<number>;
    onUpdate: (productId: number, delta: number) => void;
    onRemove: (orderProductId: number) => void;
    onNote: (orderProductId: number, note: string) => Promise<void>;
    onClear: () => void;
    onUpdateDiscount: (descuento: number) => Promise<void>;
    onUpdateProductDiscount: (productId: number, descuento: number) => Promise<void>;
}

export const CartPanel = ({
    order,
    cart,
    subtotal,
    orderDiscount,
    total,
    isLoading,
    isReadOnly = false,
    pendingProductIds,
    onUpdate,
    onRemove,
    onNote,
    onClear,
    onUpdateDiscount,
    onUpdateProductDiscount,
}: CartPanelProps) => {
    const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const { can } = usePermissions();
    const {
        isOpen: payOpen,
        cash,
        setCash,
        change,
        canPay,
        isPending,
        propina,
        setPropina,
        paymentMethods,
        paymentMethodId,
        setPaymentMethodId,
        isCash,
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
                                    isPending={item.id !== null && (pendingProductIds?.has(item.id) ?? false)}
                                    onUpdate={onUpdate}
                                    onRemove={onRemove}
                                    onNote={onNote}
                                    onUpdateProductDiscount={onUpdateProductDiscount}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <CartFooter
                    subtotal={subtotal}
                    orderDiscount={orderDiscount}
                    total={total}
                    hasItems={cart.length > 0}
                    isReadOnly={isReadOnly}
                    orderId={order?.id ?? 0}
                    canPay={can("payOrder")}
                    onPay={openPay}
                    onUpdateDiscount={onUpdateDiscount}
                />
            </div>

            <RestaurantPayModal
                isOpen={payOpen}
                subtotal={subtotal}
                cash={cash}
                setCash={setCash}
                change={change}
                canPay={canPay}
                isPending={isPending}
                propina={propina}
                setPropina={setPropina}
                paymentMethods={paymentMethods}
                paymentMethodId={paymentMethodId}
                setPaymentMethodId={setPaymentMethodId}
                isCash={isCash}
                onPay={handlePay}
                onClose={closePay}
            />
        </>
    );
};
