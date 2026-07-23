import { Eraser } from "lucide-react";
import { DeliveryPaidByEnum } from "@/enums/DeliveryPaidByEnum";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { IModalCartItem } from "@/models/IModalCartItem";
import { NewSaleCartItem } from "./NewSaleCartItem";
import { NewSaleCartFooter } from "./NewSaleCartFooter";
import { IProduct } from "@/models/IProduct";

interface NewSaleCartPanelProps {
    cart: IModalCartItem[];
    sellByWeight: boolean;
    domicilioActivo: boolean;
    toggleDomicilio: (checked: boolean) => void;
    costoDomicilio: string;
    setCostoDomicilio: (v: string) => void;
    orderDeliveryPaidBy: DeliveryPaidByEnum;
    setOrderDeliveryPaidBy: (v: DeliveryPaidByEnum) => void;
    customerPays: boolean;
    domicilio: number;
    total: number;
    totalFinal: number;
    getDisplayQty: (orderProductId: number, cantidad: number) => string;
    handleQtyChange: (orderProductId: number, value: string) => void;
    handleQtyBlur: (orderProductId: number) => void;
    getItemMode: (productId: number, product: IProduct) => WeightInputModeEnum;
    toggleItemMode: (productId: number, orderProductId: number, product: IProduct) => void;
    getDisplayPrice: (orderProductId: number, item: IModalCartItem) => string;
    handlePriceChange: (orderProductId: number, value: string) => void;
    handlePriceBlur: (orderProductId: number) => void;
    removeFromCart: (orderProductId: number) => Promise<void>;
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
    getItemMode, toggleItemMode, getDisplayPrice, handlePriceChange, handlePriceBlur,
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

        <div className="flex-1 min-h-0 overflow-y-auto pb-2">
            {cart.length === 0 ? (
                <p className="text-xs text-stone-400 text-center pt-8">Sin productos</p>
            ) : (
                <div className="sm:px-4 sm:space-y-2">
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
