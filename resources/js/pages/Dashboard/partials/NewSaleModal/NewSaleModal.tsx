import { Loader } from "lucide-react";
import { useNewSaleModal } from "./useNewSaleModal";
import { IOrder } from "@/models/IOrder";
import { NewSaleModalHeader } from "./NewSaleModalHeader";
import { NewSaleProductPanel } from "./NewSaleProductPanel";
import { NewSaleCartPanel } from "./NewSaleCartPanel";
import { SellByWeightPayModal } from "./SellByWeightPayModal";

interface NewSaleModalProps {
    onClose: () => void;
    initialOrder?: IOrder;
}

export const NewSaleModal = ({ onClose, initialOrder }: NewSaleModalProps) => {
    const {
        search, setSearch,
        nombrePedido, setNombrePedido, handleNombreBlur,
        domicilioActivo, toggleDomicilio,
        costoDomicilio, setCostoDomicilio,
        orderDeliveryPaidBy, setOrderDeliveryPaidBy,
        categories, selectedCategory, setSelectedCategory,
        products, productsLoading,
        cart, total, totalFinal, domicilio, customerPays,
        sellByWeight,
        addToCart, removeFromCart, clearCart,
        getDisplayQty, handleQtyChange, handleQtyBlur,
        getItemMode, toggleItemMode, getDisplayPrice, handlePriceChange, handlePriceBlur,
        isCreatingOrder, handleClose, loadingOrder, isResuming,
        showPayModal, setShowPayModal,
        cash, setCash, cashNum, change, canPay,
        paymentMethods, paymentMethodId, setPaymentMethodId, isCashMethod,
        isPaying, handlePay,
    } = useNewSaleModal(onClose, initialOrder);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-hidden">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-7xl flex flex-col overflow-hidden max-h-[calc(100dvh-2rem)]">

                <NewSaleModalHeader isResuming={isResuming} onClose={handleClose} />

                {loadingOrder ? (
                    <div className="flex-1 flex items-center justify-center py-16">
                        <Loader size={28} className="animate-spin text-amber-400" />
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row flex-1 min-h-0 overflow-hidden">
                        <NewSaleProductPanel
                            search={search}
                            setSearch={setSearch}
                            nombrePedido={nombrePedido}
                            setNombrePedido={setNombrePedido}
                            handleNombreBlur={handleNombreBlur}
                            categories={categories}
                            selectedCategory={selectedCategory}
                            setSelectedCategory={setSelectedCategory}
                            products={products}
                            productsLoading={productsLoading}
                            isCreatingOrder={isCreatingOrder}
                            onAddProduct={addToCart}
                        />

                        <NewSaleCartPanel
                            cart={cart}
                            sellByWeight={sellByWeight}
                            domicilioActivo={domicilioActivo}
                            toggleDomicilio={toggleDomicilio}
                            costoDomicilio={costoDomicilio}
                            setCostoDomicilio={setCostoDomicilio}
                            orderDeliveryPaidBy={orderDeliveryPaidBy}
                            setOrderDeliveryPaidBy={setOrderDeliveryPaidBy}
                            customerPays={customerPays}
                            domicilio={domicilio}
                            total={total}
                            totalFinal={totalFinal}
                            getDisplayQty={getDisplayQty}
                            handleQtyChange={handleQtyChange}
                            handleQtyBlur={handleQtyBlur}
                            getItemMode={getItemMode}
                            toggleItemMode={toggleItemMode}
                            getDisplayPrice={getDisplayPrice}
                            handlePriceChange={handlePriceChange}
                            handlePriceBlur={handlePriceBlur}
                            removeFromCart={removeFromCart}
                            clearCart={clearCart}
                            onPay={() => {
                                const first = paymentMethods.find((m) => m.active);
                                setPaymentMethodId(first?.id ?? null);
                                setShowPayModal(true);
                            }}
                        />
                    </div>
                )}
            </div>

            {showPayModal && (
                <SellByWeightPayModal
                    totalFinal={totalFinal}
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
                    onConfirm={handlePay}
                    onClose={() => setShowPayModal(false)}
                />
            )}
        </div>
    );
};
