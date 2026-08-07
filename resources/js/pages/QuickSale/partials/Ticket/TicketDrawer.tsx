import { Trash2 } from "lucide-react";
import { DeliveryPaidByEnum } from "@/enums/DeliveryPaidByEnum";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { useQuickSaleContext } from "../../QuickSaleContext";
import { DeliverySection } from "./DeliverySection";
import { TicketRow } from "./TicketRow";

const weightLabel = (cantidadKg: number) =>
    cantidadKg >= 1 ? `${cantidadKg.toFixed(2)} kg` : `${Math.round(cantidadKg * 1000)} g`;

export const TicketDrawer = () => {
    const { cart, removeFromCart, clearCart, domicilioActivo, domicilioNum, deliveryPaidBy } = useQuickSaleContext();

    return (
        <div className="max-h-[26rem] overflow-y-auto bg-white border-t border-stone-200">
            <div className="flex items-center justify-between gap-3 px-5 py-2.5 bg-stone-50 border-b border-stone-200">
                <DeliverySection />
                <button
                    type="button"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    aria-label="Vaciar ticket"
                    title="Vaciar ticket"
                    className="shrink-0 text-stone-400 hover:text-red-500 disabled:opacity-40 disabled:hover:text-stone-400 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
            </div>

            <div className="px-5 py-2">
                {cart.length === 0 ? (
                    <p className="py-6 text-center text-sm text-stone-400">Aún no hay productos en el ticket</p>
                ) : (
                    cart.map((item) => (
                        <TicketRow
                            key={item.orderProductId}
                            name={item.product.nombre}
                            weightLabel={weightLabel(item.cantidad)}
                            unitPrice={item.precioEfectivo}
                            lineTotal={item.precioEfectivo * item.cantidad}
                            onRemove={() => removeFromCart(item.orderProductId)}
                        />
                    ))
                )}

                {domicilioActivo && domicilioNum > 0 && (
                    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-stone-100 last:border-b-0">
                        <p className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                            Envío a domicilio
                            {deliveryPaidBy === DeliveryPaidByEnum.Business && (
                                <span className="text-[10px] font-bold uppercase tracking-wide text-stone-500 bg-stone-100 border border-stone-200 rounded-full px-2 py-0.5">
                                    Paga el negocio
                                </span>
                            )}
                        </p>
                        <span
                            className={`text-sm font-semibold tabular-nums ${
                                deliveryPaidBy === DeliveryPaidByEnum.Business ? "text-stone-400 line-through" : "text-stone-900"
                            }`}
                        >
                            {formatCurrencyTrimmed(domicilioNum)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
