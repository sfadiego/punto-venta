import { Eraser } from "lucide-react";
import { DeliveryPaidByEnum } from "@/enums/DeliveryPaidByEnum";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { IModalCartItem } from "@/models/IModalCartItem";
import { NewSaleCartItem } from "./CartItem/NewSaleCartItem";
import { NewSaleCartFooter } from "./NewSaleCartFooter";
import { IProduct } from "@/models/IProduct";

interface NewSaleCartPanelProps {
    cart: IModalCartItem[];
    sellByWeight: boolean;
    domicilioActivo: boolean;
    toggleDomicilio: (checked: boolean) => void;
    costoDomicilio: string;
    setCostoDomicilio: (v: string) => void;
    setOrderDeliveryPaidBy: (v: DeliveryPaidByEnum) => void;
    customerPays: boolean;
    domicilio: number;
    total: number;
    totalFinal: number;
    getDisplayQty: (orderProductId: number, cantidad: number) => string;
    handleQtyChange: (orderProductId: number, value: string) => void;
    handleQtyBlur: (orderProductId: number) => void;
    handleScaleReading: (orderProductId: number) => Promise<void>;
    scaleSupported: boolean;
    getItemMode: (productId: number, product: IProduct) => WeightInputModeEnum;
    toggleItemMode: (productId: number, orderProductId: number, product: IProduct) => void;
    getDisplayPrice: (orderProductId: number, item: IModalCartItem) => string;
    handlePriceChange: (orderProductId: number, value: string) => void;
    handlePriceBlur: (orderProductId: number) => void;
    removeFromCart: (orderProductId: number) => Promise<void>;
    clearCart: () => void;
    isClearing: boolean;
    onPay: () => void;
}

export const NewSaleCartPanel = ({
    cart, sellByWeight,
    domicilioActivo, toggleDomicilio,
    costoDomicilio, setCostoDomicilio,
    setOrderDeliveryPaidBy,
    customerPays, domicilio,
    total, totalFinal,
    getDisplayQty, handleQtyChange, handleQtyBlur,
    handleScaleReading, scaleSupported,
    getItemMode, toggleItemMode, getDisplayPrice, handlePriceChange, handlePriceBlur,
    removeFromCart, clearCart, isClearing, onPay,
}: NewSaleCartPanelProps) => (
    <div className="flex flex-col w-full sm:w-80 flex-1 sm:shrink-0 min-h-0 overflow-hidden bg-stone-50 border-t border-stone-100 sm:border-t-0 sm:bg-white">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">
                Carrito
            </p>
            {cart.length > 0 && (
                <button
                    onClick={clearCart}
                    disabled={isClearing}
                    className="flex items-center gap-1 text-xs text-stone-400 hover:text-red-400 transition-colors disabled:opacity-50 disabled:pointer-events-none"
                >
                    <Eraser size={11} />
                    Limpiar
                </button>
            )}
        </div>

        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto overflow-x-hidden pb-2">
            {cart.length === 0 ? (
                <p className="text-xs text-stone-400 text-center pt-8">Sin productos</p>
            ) : (
                <div className="px-3 pt-1 sm:px-4">
                    {cart.map((item) => {
                        const mode = getItemMode(item.productId, item.product);
                        return (
                            <NewSaleCartItem
                                key={item.orderProductId}
                                item={item}
                                mode={mode}
                                displayQty={getDisplayQty(item.orderProductId, item.cantidad)}
                                displayPrice={getDisplayPrice(item.orderProductId, item)}
                                onModeToggle={() => toggleItemMode(item.productId, item.orderProductId, item.product)}
                                onQtyChange={(v) => handleQtyChange(item.orderProductId, v)}
                                onQtyBlur={() => handleQtyBlur(item.orderProductId)}
                                onReadScale={() => handleScaleReading(item.orderProductId)}
                                scaleSupported={scaleSupported}
                                onPriceChange={(v) => handlePriceChange(item.orderProductId, v)}
                                onPriceBlur={() => handlePriceBlur(item.orderProductId)}
                                onRemove={() => removeFromCart(item.orderProductId)}
                            />
                        );
                    })}
                </div>
            )}
        </div>

        <NewSaleCartFooter
            sellByWeight={sellByWeight}
            domicilioActivo={domicilioActivo}
            toggleDomicilio={toggleDomicilio}
            costoDomicilio={costoDomicilio}
            setCostoDomicilio={setCostoDomicilio}
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
