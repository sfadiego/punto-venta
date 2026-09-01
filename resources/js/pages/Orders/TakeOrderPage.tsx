import { useLayout } from "@/contexts/LayoutContext";
import { useAxios } from "@/hooks/useAxios";
import { TakeOrderMobileTabEnum } from "@/enums/TakeOrderMobileTabEnum";
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
    const { features } = useAxios();
    // "!== false" (no "=== true"): negocios ya logueados antes de agregar estos flags tienen
    // `features` en localStorage sin show_delivery/show_extras — deben seguir viendo ambas
    // secciones hasta el siguiente login, igual que el criterio ya usado para order_served.
    const showDelivery = features?.show_delivery !== false;
    const showAddExtra = features?.show_extras !== false;
    const isRetail = features?.is_retail === true;

    const {
        order,
        cart,
        cartCount,
        subtotal,
        orderDiscount,
        total,
        totalFinal,
        domicilioActivo,
        toggleDomicilio,
        costoDomicilio,
        setCostoDomicilio,
        handleCostoDomicilioBlur,
        setOrderDeliveryPaidBy,
        domicilio,
        customerPays,
        loadingCart,
        loadingOrder,
        isError,
        isReadOnly,
        pendingProductIds,
        addToCart,
        addExtra,
        updateQuantity,
        saveObservacion,
        removeFromCart,
        clearCart,
        isClearingCart,
        updateOrderDiscount,
        updateProductDiscount,
    } = useTakeOrder();

    const { mobileTab, setMobileTab, handleBack } = useTakeOrderPage(loadingOrder, isError);

    const { isOpen: extraOpen, openModal: openExtra, handleClose: closeExtra, formik: extraFormik } =
        useAddExtraModal(addExtra);

    if (loadingOrder || isError) {
        return <TakeOrderSkeleton />;
    }

    // Mismas props para ambas instancias de ProductGrid/CartPanel (desktop y mobile renderizan
    // el mismo contenido, solo cambia el layout que las envuelve) — evita mantener 2 copias.
    const productGrid = (
        <ProductGrid
            cart={cart}
            isReadOnly={isReadOnly}
            isRetail={isRetail}
            pendingProductIds={pendingProductIds}
            onAdd={addToCart}
        />
    );
    const cartPanel = (
        <CartPanel
            order={order}
            cart={cart}
            subtotal={subtotal}
            orderDiscount={orderDiscount}
            total={total}
            totalFinal={totalFinal}
            domicilioActivo={domicilioActivo}
            toggleDomicilio={toggleDomicilio}
            costoDomicilio={costoDomicilio}
            setCostoDomicilio={setCostoDomicilio}
            onCostoDomicilioBlur={handleCostoDomicilioBlur}
            setOrderDeliveryPaidBy={setOrderDeliveryPaidBy}
            domicilio={domicilio}
            customerPays={customerPays}
            isLoading={loadingCart}
            isReadOnly={isReadOnly}
            showDelivery={showDelivery}
            onUpdate={updateQuantity}
            onRemove={removeFromCart}
            onNote={saveObservacion}
            onClear={clearCart}
            isClearingCart={isClearingCart}
            onUpdateDiscount={updateOrderDiscount}
            onUpdateProductDiscount={updateProductDiscount}
        />
    );

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
                    showAddExtra={showAddExtra}
                />
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 overflow-hidden bg-stone-50 border-r border-stone-200">
                        {productGrid}
                    </div>
                    <div className="w-80 xl:w-96 flex-shrink-0 overflow-hidden flex flex-col">
                        {cartPanel}
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
                    showAddExtra={showAddExtra}
                    compact
                />
                <div className="flex-1 overflow-y-auto">
                    {mobileTab === TakeOrderMobileTabEnum.Products ? productGrid : cartPanel}
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
