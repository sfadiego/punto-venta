import { Eraser } from "lucide-react";
import { ModalCartItem } from "./useNewSaleModal";
import { NewSaleCartItem } from "./NewSaleCartItem";
import { NewSaleCartFooter } from "./NewSaleCartFooter";

interface NewSaleCartPanelProps {
    cart: ModalCartItem[];
    sellByWeight: boolean;
    domicilioActivo: boolean;
    toggleDomicilio: (checked: boolean) => void;
    costoDomicilio: string;
    setCostoDomicilio: (v: string) => void;
    orderDeliveryPaidBy: "customer" | "business";
    setOrderDeliveryPaidBy: (v: "customer" | "business") => void;
    customerPays: boolean;
    domicilio: number;
    total: number;
    totalFinal: number;
    getDisplayQty: (productId: number, cantidad: number) => string;
    handleQtyChange: (productId: number, value: string) => void;
    handleQtyBlur: (productId: number) => void;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;
    onPay: () => void;
}

export const NewSaleCartPanel = ({
    cart, sellByWeight,
    domicilioActivo, toggleDomicilio,
    costoDomicilio, setCostoDomicilio,
    orderDeliveryPaidBy, setOrderDeliveryPaidBy,
    customerPays, domicilio,
    total, totalFinal,
    getDisplayQty, handleQtyChange, handleQtyBlur,
    removeFromCart, clearCart, onPay,
}: NewSaleCartPanelProps) => (
    <div className="flex flex-col w-full sm:w-80 shrink-0 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Carrito
            </p>
            {cart.length > 0 && (
                <button
                    onClick={clearCart}
                    className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-400 transition-colors"
                >
                    <Eraser size={11} />
                    Limpiar
                </button>
            )}
        </div>

        <div className="flex-1 overflow-y-auto pb-2">
            {cart.length === 0 ? (
                <p className="text-xs text-stone-400 text-center pt-8">Sin productos</p>
            ) : (
                <div className="sm:px-4 sm:space-y-2">
                    {cart.map((item) => (
                        <NewSaleCartItem
                            key={item.productId}
                            item={item}
                            displayQty={getDisplayQty(item.productId, item.cantidad)}
                            onQtyChange={(v) => handleQtyChange(item.productId, v)}
                            onQtyBlur={() => handleQtyBlur(item.productId)}
                            onRemove={() => removeFromCart(item.productId)}
                        />
                    ))}
                </div>
            )}
        </div>

        <NewSaleCartFooter
            sellByWeight={sellByWeight}
            domicilioActivo={domicilioActivo}
            toggleDomicilio={toggleDomicilio}
            costoDomicilio={costoDomicilio}
            setCostoDomicilio={setCostoDomicilio}
            orderDeliveryPaidBy={orderDeliveryPaidBy}
            setOrderDeliveryPaidBy={setOrderDeliveryPaidBy}
            customerPays={customerPays}
            domicilio={domicilio}
            total={total}
            totalFinal={totalFinal}
            hasItems={cart.length > 0}
            onPay={onPay}
        />
    </div>
);
