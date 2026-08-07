import { SellByWeightPayModal } from "@/pages/Dashboard/partials/SellByWeightSaleModal/PayModal/SellByWeightPayModal";
import { useQuickSaleContext } from "../../QuickSaleContext";
import { QuickSaleHeader } from "./QuickSaleHeader";
import { CategoryRail } from "../CategoryRail/CategoryRail";
import { ProductGrid } from "../ProductGrid/ProductGrid";
import { TicketBar } from "../Ticket/TicketBar";

export const QuickSaleContent = () => {
    const {
        resumeOrderId,
        loadingResumeOrder,
        total,
        showPayModal,
        setShowPayModal,
        productsTotal,
        domicilioNum,
        domicilioActivo,
        customerPays,
        cash,
        setCash,
        cashNum,
        change,
        canPay,
        isPaying,
        paymentMethods,
        paymentMethodId,
        setPaymentMethodId,
        isCashMethod,
        isCreditMode,
        setIsCreditMode,
        customers,
        selectedCustomerId,
        setSelectedCustomerId,
        handlePay,
    } = useQuickSaleContext();

    if (resumeOrderId && loadingResumeOrder) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Layout único y responsivo: overlay de pantalla completa en mobile, en flujo normal desde lg */}
            <div className="fixed inset-0 z-10 flex flex-col h-full overflow-hidden bg-white lg:static lg:z-auto">
                <QuickSaleHeader />
                <div className="flex flex-1 min-h-0">
                    <CategoryRail />
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto p-4 lg:p-5 bg-stone-50">
                            <ProductGrid />
                        </div>
                        <TicketBar />
                    </div>
                </div>
            </div>

            {showPayModal && (
                <SellByWeightPayModal
                    totalFinal={total}
                    subtotal={productsTotal}
                    domicilio={domicilioNum}
                    domicilioActivo={domicilioActivo}
                    customerPays={customerPays}
                    cash={cash}
                    setCash={setCash}
                    cashNum={cashNum}
                    change={change}
                    canPay={canPay}
                    isPaying={isPaying}
                    paymentMethods={paymentMethods}
                    paymentMethodId={paymentMethodId}
                    setPaymentMethodId={setPaymentMethodId}
                    isCashMethod={isCashMethod}
                    creditModeAvailable
                    isCreditMode={isCreditMode}
                    setIsCreditMode={setIsCreditMode}
                    customers={customers}
                    selectedCustomerId={selectedCustomerId}
                    setSelectedCustomerId={setSelectedCustomerId}
                    onConfirm={handlePay}
                    onClose={() => setShowPayModal(false)}
                />
            )}
        </div>
    );
};
