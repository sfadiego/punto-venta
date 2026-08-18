import { Landmark } from "lucide-react";
import { IOrder } from "@/models/IOrder";
import { PaymentMethodBadge } from "@/components/orders/PaymentMethodBadge";

interface PaymentOrCreditBadgeProps {
    order: Pick<IOrder, "is_credit" | "payment_method">;
}

export const PaymentOrCreditBadge = ({ order }: PaymentOrCreditBadgeProps) => {
    if (order.is_credit) {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                <Landmark size={11} />
                Crédito
            </span>
        );
    }

    return <PaymentMethodBadge name={order.payment_method?.name} />;
};
