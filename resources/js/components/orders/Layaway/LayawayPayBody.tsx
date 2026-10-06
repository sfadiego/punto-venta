import { CustomerCreditPicker } from "@/components/orders/CustomerCredit/CustomerCreditPicker";
import { PaymentMethodSelector } from "@/components/orders/PayModal/PaymentMethodSelector";
import { LayawayDepositSelector } from "./LayawayDepositSelector";
import { LayawaySummary } from "./LayawaySummary";
import { LayawayPay } from "./useLayawayPay";

interface LayawayPayBodyProps {
    layaway: LayawayPay;
}

export const LayawayPayBody = ({ layaway }: LayawayPayBodyProps) => {
    const { formik, customers, paymentMethods, total, deposit, balance, dueDate } = layaway;

    return (
        <div className="space-y-4">
            <CustomerCreditPicker
                customers={customers}
                selectedCustomerId={formik.values.customer_id}
                onSelect={(id) => formik.setFieldValue("customer_id", id)}
                requireCredit={false}
            />

            <LayawayDepositSelector layaway={layaway} />

            <LayawaySummary total={total} deposit={deposit} balance={balance} dueDate={dueDate} />

            <PaymentMethodSelector
                label="Método de pago del anticipo"
                paymentMethods={paymentMethods}
                paymentMethodId={formik.values.payment_method_id}
                onSelect={(id) => formik.setFieldValue("payment_method_id", id)}
            />
        </div>
    );
};
