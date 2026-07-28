import { DeliveryPaidByEnum } from "@/enums/DeliveryPaidByEnum";
import { CartDiscountRow } from "./CartDiscountRow";
import { CartDeliveryFields } from "./CartDeliveryFields";
import { CartTotalRow } from "./CartTotalRow";
import { CartCheckoutActions } from "./CartCheckoutActions";

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

    return (
        <div className="px-5 py-4 border-t border-stone-100 bg-stone-50 flex-shrink-0">
            <div className="space-y-2 mb-4">
                <CartDiscountRow
                    subtotal={subtotal}
                    orderDiscount={orderDiscount}
                    isReadOnly={isReadOnly}
                    onUpdateDiscount={onUpdateDiscount}
                />

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
