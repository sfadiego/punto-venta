import { X, Loader, ShoppingCart } from "lucide-react";
import { IPaymentMethod } from "@/models/IPaymentMethod";
import { ICustomer } from "@/models/ICustomer";
import { CustomerCreditPicker } from "./CustomerCreditPicker";
import { PayModalTotalSummary } from "./PayModalTotalSummary";
import { PaymentMethodSelector } from "./PaymentMethodSelector";
import { CashPaymentSection } from "./CashPaymentSection";

interface SellByWeightPayModalProps {
    totalFinal: number;
    subtotal?: number;
    domicilio?: number;
    domicilioActivo?: boolean;
    customerPays?: boolean;
    cash: string;
    setCash: (v: string) => void;
    cashNum: number;
    change: number;
    canPay: boolean;
    isPaying: boolean;
    paymentMethods: IPaymentMethod[];
    paymentMethodId: number | null;
    setPaymentMethodId: (id: number | null) => void;
    isCashMethod: boolean;
    creditModeAvailable?: boolean;
    isCreditMode?: boolean;
    setIsCreditMode?: (v: boolean) => void;
    customers?: ICustomer[];
    selectedCustomerId?: number | null;
    setSelectedCustomerId?: (id: number | null) => void;
    onConfirm: () => void;
    onClose: () => void;
}

export const SellByWeightPayModal = ({
    totalFinal, subtotal, domicilio = 0, domicilioActivo = false, customerPays = true,
    cash, setCash, cashNum, change,
    canPay, isPaying,
    paymentMethods, paymentMethodId, setPaymentMethodId, isCashMethod,
    creditModeAvailable = false, isCreditMode = false, setIsCreditMode = () => {},
    customers = [], selectedCustomerId = null, setSelectedCustomerId = () => {},
    onConfirm, onClose,
}: SellByWeightPayModalProps) => (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-stone-900">Cobrar</h3>
                <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-3">
                <PayModalTotalSummary
                    totalFinal={totalFinal}
                    subtotal={subtotal}
                    domicilio={domicilio}
                    domicilioActivo={domicilioActivo}
                    customerPays={customerPays}
                />

                <PaymentMethodSelector
                    paymentMethods={paymentMethods}
                    paymentMethodId={paymentMethodId}
                    setPaymentMethodId={setPaymentMethodId}
                    isCreditMode={isCreditMode}
                    setIsCreditMode={setIsCreditMode}
                    creditModeAvailable={creditModeAvailable}
                />

                {isCreditMode ? (
                    <CustomerCreditPicker
                        customers={customers}
                        selectedCustomerId={selectedCustomerId}
                        onSelect={setSelectedCustomerId}
                    />
                ) : (
                    <CashPaymentSection
                        isCashMethod={isCashMethod}
                        totalFinal={totalFinal}
                        cash={cash}
                        setCash={setCash}
                        cashNum={cashNum}
                        change={change}
                    />
                )}
            </div>

            <button
                onClick={onConfirm}
                disabled={!canPay || isPaying}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
                {isPaying
                    ? <Loader size={15} className="animate-spin" />
                    : <ShoppingCart size={15} />
                }
                {isCreditMode ? "Registrar venta a crédito" : "Confirmar pago"}
            </button>
        </div>
    </div>
);
