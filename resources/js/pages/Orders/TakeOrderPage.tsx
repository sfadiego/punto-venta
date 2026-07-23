import { useLayout } from "@/contexts/LayoutContext";
import { useTakeOrder } from "./useTakeOrder";
import { useTakeOrderPage } from "./useTakeOrderPage";
import { ProductGrid } from "./partials/ProductSelector/ProductGrid";
import { CartPanel } from "./partials/Cart/CartPanel";
import { AddExtraModal } from "./partials/AddExtraModal/AddExtraModal";
import { useAddExtraModal } from "./partials/AddExtraModal/useAddExtraModal";
import { TakeOrderHeader } from "./partials/TakeOrderLayout/TakeOrderHeader";
import { TakeOrderMobileTabBar } from "./partials/TakeOrderLayout/TakeOrderMobileTabBar";
import { TakeOrderSkeleton } from "./partials/TakeOrderLayout/TakeOrderSkeleton";

export default function TakeOrderPage() {
    const { toggleSidebar } = useLayout();
    const { mobileTab, setMobileTab, handleBack } = useTakeOrderPage();

    const {
        order,
        cart,
        cartCount,
        subtotal,
        orderDiscount,
        total,
        loadingCart,
        loadingOrder,
        isReadOnly,
        pendingProductIds,
        addToCart,
        addExtra,
        updateQuantity,
        saveObservacion,
        removeFromCart,
        clearCart,
        updateOrderDiscount,
        updateProductDiscount,
    } = useTakeOrder();

    const { isOpen: extraOpen, openModal: openExtra, handleClose: closeExtra, formik: extraFormik } =
        useAddExtraModal(addExtra);

    if (loadingOrder) {
        return <TakeOrderSkeleton />;
    }

    return (
        <div className="flex flex-col h-full">
            {/* Desktop */}
            <div className="hidden lg:flex flex-col h-full overflow-hidden">
                <TakeOrderHeader
                    title={order?.nombre_pedido ?? "Tomar pedido"}
                    isReadOnly={isReadOnly}
                    onBack={handleBack}
                    onAddExtra={openExtra}
                    onMenuClick={toggleSidebar}
                />
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 overflow-hidden bg-stone-50 border-r border-stone-200">
                        <ProductGrid
                            cart={cart}
                            isReadOnly={isReadOnly}
                            pendingProductIds={pendingProductIds}
                            onAdd={addToCart}
                        />
                    </div>
                    <div className="w-80 xl:w-96 flex-shrink-0 overflow-hidden flex flex-col">
                        <CartPanel
                            order={order}
                            cart={cart}
                            subtotal={subtotal}
                            orderDiscount={orderDiscount}
                            total={total}
                            isLoading={loadingCart}
                            isReadOnly={isReadOnly}
                            onUpdate={updateQuantity}
                            onRemove={removeFromCart}
                            onNote={saveObservacion}
                            onClear={clearCart}
                            onUpdateDiscount={updateOrderDiscount}
                            onUpdateProductDiscount={updateProductDiscount}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile — overlay de pantalla completa independiente del layout padre */}
            <div className="lg:hidden fixed inset-0 z-10 flex flex-col bg-stone-50">
                <TakeOrderHeader
                    title={order?.nombre_pedido ?? "Tomar pedido"}
                    isReadOnly={isReadOnly}
                    onBack={handleBack}
                    onAddExtra={openExtra}
                    compact
                />
                <div className="flex-1 overflow-y-auto">
                    {mobileTab === "products" ? (
                        <ProductGrid
                            cart={cart}
                            isReadOnly={isReadOnly}
                            pendingProductIds={pendingProductIds}
                            onAdd={addToCart}
                        />
                    ) : (
                        <CartPanel
                            order={order}
                            cart={cart}
                            subtotal={subtotal}
                            orderDiscount={orderDiscount}
                            total={total}
                            isLoading={loadingCart}
                            isReadOnly={isReadOnly}
                            onUpdate={updateQuantity}
                            onRemove={removeFromCart}
                            onNote={saveObservacion}
                            onClear={clearCart}
                            onUpdateDiscount={updateOrderDiscount}
                            onUpdateProductDiscount={updateProductDiscount}
                        />
                    )}
                </div>
                <TakeOrderMobileTabBar
                    activeTab={mobileTab}
                    cartCount={cartCount}
                    onTabChange={setMobileTab}
                />
            </div>

            <AddExtraModal isOpen={extraOpen} formik={extraFormik} onClose={closeExtra} />
        </div>
    );
}
