import { DeliveryPaidByEnum } from "@/enums/DeliveryPaidByEnum";
import { CartDeliveryFields } from "@/components/orders/CartDeliveryFields";
import { CartDiscountRow } from "./CartDiscountRow";
import { CartTotalRow } from "./CartTotalRow";
import { CartCheckoutActions } from "./CartCheckoutActions";
import { FeatureSpotlightKey } from "@/enums/FeatureSpotlightEnum";
import { FeatureSpotlight } from "@/components/ui/interactions/FeatureSpotlight/FeatureSpotlight";

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
    setOrderDeliveryPaidBy: (v: DeliveryPaidByEnum) => void;
    domicilio: number;
    customerPays: boolean;
    hasItems: boolean;
    isReadOnly?: boolean;
    showDelivery?: boolean;
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
    showDelivery = true,
    orderId,
    canPay,
    onPay,
    onUpdateDiscount,
}: CartFooterProps) => {
    const domicilioExcedeTotal = domicilioActivo && !customerPays && domicilio > total && total > 0;

    return (
        <div className="px-5 py-4 border-t border-stone-100 bg-stone-50 flex-shrink-0">
            <div className="space-y-2 mb-4">
                <CartDiscountRow
                    subtotal={subtotal}
                    orderDiscount={orderDiscount}
                    isReadOnly={isReadOnly}
                    onUpdateDiscount={onUpdateDiscount}
                />
                {/* show_delivery: false para negocios tipo Retail (venta de mostrador) — el
                    envío a domicilio no aplica a ese flujo (ver BusinessTypeEnum::features()). */}
                {showDelivery && (
                    <FeatureSpotlight
                        featureKey={FeatureSpotlightKey.DeliverySectionButton}
                        title="Envio Domicilio"
                        description="Envio a domicilio, podrás gestionar los pedidos a domicilio."
                        variant="block"
                        placement="top-start"
                    >
                        <CartDeliveryFields
                            domicilioActivo={domicilioActivo}
                            toggleDomicilio={toggleDomicilio}
                            costoDomicilio={costoDomicilio}
                            setCostoDomicilio={setCostoDomicilio}
                            onCostoDomicilioBlur={onCostoDomicilioBlur}
                            setOrderDeliveryPaidBy={setOrderDeliveryPaidBy}
                            domicilio={domicilio}
                            customerPays={customerPays}
                            isReadOnly={isReadOnly}
                        />
                    </FeatureSpotlight>
                )}
                <CartTotalRow totalFinal={totalFinal} domicilioExcedeTotal={domicilioExcedeTotal} />
            </div>

            <CartCheckoutActions
                isReadOnly={isReadOnly}
                hasItems={hasItems}
                canPay={canPay}
                disablePay={domicilioExcedeTotal}
                orderId={orderId}
                onPay={onPay}
            />
        </div>
    );
};
