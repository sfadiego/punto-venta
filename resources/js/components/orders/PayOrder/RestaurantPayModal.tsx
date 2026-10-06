import { IPaymentMethod } from "@/models/IPaymentMethod";
import { ICustomer } from "@/models/ICustomer";
import { PayModalHeader } from "../PayModal/PayModalHeader";
import { PayModalTotalSummary } from "../PayModal/PayModalTotalSummary";
import { PaymentMethodSelector } from "../PayModal/PaymentMethodSelector";
import { PayTransferAlert } from "../PayModal/PayTransferAlert";
import { PayCashInput } from "../PayModal/PayCashInput";
import { PayPropinaInput } from "../PayModal/PayPropinaInput";
import { PayModalActions } from "../PayModal/PayModalActions";
import { CustomerCreditPicker } from "@/components/orders/CustomerCredit/CustomerCreditPicker";
import { useAxios } from "@/hooks/useAxios";
import { useGetBusinessConfig } from "@/services/useBusinessConfigService";
import { LayawayPayBody } from "@/components/orders/Layaway/LayawayPayBody";
import { LayawayPay } from "@/components/orders/Layaway/useLayawayPay";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";

interface RestaurantPayModalProps {
    isOpen: boolean;
    subtotal: number;
    totalFinal: number;
    domicilio: number;
    domicilioActivo: boolean;
    customerPays: boolean;
    cash: string;
    setCash: (v: string) => void;
    change: number;
    canPay: boolean;
    isPending: boolean;
    propina: string;
    setPropina: (v: string) => void;
    paymentMethods: IPaymentMethod[];
    paymentMethodId: number | null;
    isCash: boolean;
    isCreditMode?: boolean;
    selectedCustomerId?: number | null;
    customers?: ICustomer[];
    onPay: () => void;
    onClose: () => void;
    onSelectMethod: (id: number) => void;
    onSelectCredit?: () => void;
    onSelectCustomer?: (id: number) => void;
    /** Modo apartado (solo retail) — omitido en los flujos que no lo soportan. */
    layaway?: LayawayPay;
}

export const RestaurantPayModal = ({
    isOpen,
    subtotal,
    totalFinal,
    domicilio,
    domicilioActivo,
    customerPays,
    cash,
    setCash,
    change,
    canPay,
    isPending,
    propina,
    setPropina,
    paymentMethods,
    paymentMethodId,
    isCash,
    isCreditMode = false,
    selectedCustomerId = null,
    customers = [],
    onPay,
    onClose,
    onSelectMethod,
    onSelectCredit,
    onSelectCustomer = () => {},
    layaway,
}: RestaurantPayModalProps) => {
    const { features } = useAxios();
    const sellByWeight = features?.sell_by_weight === true;
    const { data: config } = useGetBusinessConfig();
    const customersAvailable = sellByWeight || config?.customers_enabled === true;

    if (!isOpen) return null;

    const layawayMode = layaway?.isLayawayMode === true;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className={`relative bg-white rounded-2xl shadow-xl w-full max-h-[92vh] overflow-y-auto transition-[max-width] duration-300 ease-out ${layawayMode ? "max-w-2xl" : layaway?.isAvailable ? "max-w-lg" : "max-w-sm"}`}>
                <PayModalHeader onClose={onClose} />

                <div className="p-5 space-y-4">
                    <PayModalTotalSummary
                        totalFinal={totalFinal}
                        subtotal={subtotal}
                        domicilio={domicilio}
                        domicilioActivo={domicilioActivo}
                        customerPays={customerPays}
                    />

                    <PaymentMethodSelector
                        paymentMethods={paymentMethods}
                        paymentMethodId={layawayMode ? null : paymentMethodId}
                        onSelect={(id) => {
                            layaway?.exit();
                            onSelectMethod(id);
                        }}
                        creditModeAvailable={customersAvailable && !!onSelectCredit}
                        isCreditMode={customersAvailable && isCreditMode && !layawayMode}
                        onSelectCredit={
                            customersAvailable
                                ? () => {
                                      layaway?.exit();
                                      onSelectCredit?.();
                                  }
                                : undefined
                        }
                        layawayAvailable={layaway?.isAvailable === true}
                        isLayawayMode={layawayMode}
                        onSelectLayaway={layaway?.enter}
                    />

                    {layaway && layawayMode ? (
                        <div key="layaway" className="pay-panel-enter">
                            <LayawayPayBody layaway={layaway} />
                        </div>
                    ) : customersAvailable && isCreditMode ? (
                        <div key="credit" className="pay-panel-enter">
                            <CustomerCreditPicker
                                customers={customers}
                                selectedCustomerId={selectedCustomerId}
                                onSelect={onSelectCustomer}
                            />
                        </div>
                    ) : (
                        <div key="payment" className="pay-panel-enter space-y-4">
                            <PayTransferAlert isCash={isCash} />

                            <PayPropinaInput
                                isCash={isCash}
                                subtotal={totalFinal}
                                propina={propina}
                                setPropina={setPropina}
                            />

                            <PayCashInput
                                isCash={isCash}
                                cash={cash}
                                setCash={setCash}
                                change={change}
                                max={Math.ceil(totalFinal * 10)}
                                totalFinal={totalFinal}
                            />
                        </div>
                    )}

                    <PayModalActions
                        canPay={layawayMode ? layaway.canSubmit : canPay}
                        isPending={layawayMode ? layaway.isPending : isPending}
                        onPay={layawayMode ? layaway.submit : onPay}
                        onClose={onClose}
                        confirmLabel={
                            layawayMode
                                ? `Apartar y cobrar ${formatCurrencyTrimmed(layaway.deposit)}`
                                : isCreditMode
                                  ? "Registrar venta a crédito"
                                  : "Pagar y cerrar"
                        }
                    />
                </div>
            </div>
        </div>
    );
};
