import { Tag, Lock, Banknote, X, Bike, AlertTriangle } from "lucide-react";
import { PrintTicketButton } from "@/components/orders/PrintTicket/PrintTicketButton";
import { DeliveryPaidByEnum } from "@/enums/DeliveryPaidByEnum";
import { useCartFooter } from "./useCartFooter";

interface CartFooterProps {
    subtotal: number;
    orderDiscount: number;
    total: number;
    totalFinal: number;
    domicilioActivo: boolean;
    toggleDomicilio: (checked: boolean) => void;
    costoDomicilio: string;
    setCostoDomicilio: (v: string) => void;
    onCostoDomicilioBlur: () => void;
    orderDeliveryPaidBy: DeliveryPaidByEnum;
    setOrderDeliveryPaidBy: (v: DeliveryPaidByEnum) => void;
    domicilio: number;
    customerPays: boolean;
    hasItems: boolean;
    isReadOnly?: boolean;
    orderId: number;
    canPay: boolean;
    onPay: () => void;
    onUpdateDiscount: (descuento: number) => Promise<void>;
}

export const CartFooter = ({
    subtotal,
    orderDiscount,
    total,
    totalFinal,
    domicilioActivo,
    toggleDomicilio,
    costoDomicilio,
    setCostoDomicilio,
    onCostoDomicilioBlur,
    setOrderDeliveryPaidBy,
    domicilio,
    customerPays,
    hasItems,
    isReadOnly = false,
    orderId,
    canPay,
    onPay,
    onUpdateDiscount,
}: CartFooterProps) => {
    const domicilioExcedeTotal = domicilioActivo && !customerPays && domicilio > total && total > 0;

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

                {!isReadOnly && (
                    <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
                        <input
                            type="checkbox"
                            checked={domicilioActivo}
                            onChange={(e) => toggleDomicilio(e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-amber-500"
                        />
                        <span className="flex items-center gap-1 text-xs text-stone-500">
                            <Bike size={12} className="text-stone-400" />
                            Envío a domicilio
                        </span>
                    </label>
                )}

                {domicilioActivo && (
                    <>
                        {!isReadOnly && (
                            <>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-stone-500 shrink-0">Costo $</label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={0.5}
                                        value={costoDomicilio}
                                        onChange={(e) => setCostoDomicilio(e.target.value)}
                                        onBlur={onCostoDomicilioBlur}
                                        placeholder="0.00"
                                        className="flex-1 px-2 py-1 border border-amber-300 rounded-lg text-xs text-right focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    />
                                </div>
                                <div className="flex rounded-lg border border-stone-200 overflow-hidden text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setOrderDeliveryPaidBy(DeliveryPaidByEnum.Customer)}
                                        className={`flex-1 py-1.5 font-medium transition-colors ${
                                            customerPays ? "bg-amber-500 text-white" : "bg-white text-stone-500 hover:bg-stone-50"
                                        }`}
                                    >
                                        Cliente paga
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setOrderDeliveryPaidBy(DeliveryPaidByEnum.Business)}
                                        className={`flex-1 py-1.5 font-medium transition-colors border-l border-stone-200 ${
                                            !customerPays ? "bg-amber-500 text-white" : "bg-white text-stone-500 hover:bg-stone-50"
                                        }`}
                                    >
                                        Negocio paga
                                    </button>
                                </div>
                            </>
                        )}

                        {domicilio > 0 && (
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-stone-500">Domicilio</span>
                                <span className={`tabular-nums ${customerPays ? "text-amber-600" : "text-stone-400"}`}>
                                    {customerPays ? `+$${domicilio.toFixed(2)}` : `-$${domicilio.toFixed(2)}`}
                                </span>
                            </div>
                        )}
                    </>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-stone-200">
                    <span className="font-bold text-stone-900">Total</span>
                    <span className="font-bold text-stone-900 text-lg tabular-nums">
                        ${totalFinal.toFixed(2)}
                    </span>
                </div>

                {domicilioExcedeTotal && (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200">
                        <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-600">
                            El costo de envío no puede superar el total de la venta cuando lo absorbe el negocio.
                        </p>
                    </div>
                )}
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
                        disabled={!hasItems || !canPay || domicilioExcedeTotal}
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
