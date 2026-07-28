import { DollarSign, AlertTriangle } from "lucide-react";
import { CartDeliveryFields } from "@/components/orders/CartDeliveryFields";
import { DeliveryPaidByEnum } from "@/enums/DeliveryPaidByEnum";
import { FeatureSpotlight } from "@/components/ui/interactions/FeatureSpotlight/FeatureSpotlight";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";

interface NewSaleCartFooterProps {
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
    hasItems: boolean;
    onPay: () => void;
}

export const NewSaleCartFooter = ({
    sellByWeight,
    domicilioActivo, toggleDomicilio,
    costoDomicilio, setCostoDomicilio,
    setOrderDeliveryPaidBy,
    customerPays, domicilio,
    total, totalFinal,
    hasItems, onPay,
}: NewSaleCartFooterProps) => {
    const domicilioExcedeTotal = domicilioActivo && !customerPays && domicilio > total && total > 0;

    return (
        <div className="px-4 py-4 border-t border-stone-100 shrink-0 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs text-stone-400">Subtotal</span>
                <span className="text-sm text-stone-600">${total.toFixed(2)}</span>
            </div>

            {sellByWeight && (
                <FeatureSpotlight
                    featureKey={FeatureSpotlightKey.DeliverySectionButton}
                    title="Envío a domicilio"
                    description="Envío a domicilio, podrás gestionar los pedidos a domicilio."
                    variant="block"
                    placement="top-start"
                >
                    <CartDeliveryFields
                        domicilioActivo={domicilioActivo}
                        toggleDomicilio={toggleDomicilio}
                        costoDomicilio={costoDomicilio}
                        setCostoDomicilio={setCostoDomicilio}
                        setOrderDeliveryPaidBy={setOrderDeliveryPaidBy}
                        domicilio={domicilio}
                        customerPays={customerPays}
                    />
                </FeatureSpotlight>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                <span className="text-sm font-medium text-stone-600">Total</span>
                <span className="text-lg font-bold text-stone-900">
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

            <button
                onClick={onPay}
                disabled={!hasItems || domicilioExcedeTotal}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl
                bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed
                text-white text-sm font-semibold transition-colors"
            >
                <DollarSign size={15} />
                Cobrar
            </button>
        </div>
    );
};
