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

    // ProductGrid/CartPanel se montan UNA sola vez cada uno y se comparten entre el layout
    // desktop y mobile reposicionándolos con CSS (ver bloque de abajo) — nunca dupliques este
    // JSX en dos contenedores "hidden lg:.../lg:hidden": ambos quedan montados a la vez (hidden
    // solo hace display:none, no desmonta), así que cada uno termina con su propio estado de
    // hooks (búsqueda, categoría activa, paginación) desincronizado del otro. Ver regla en
    // CLAUDE.md "Layouts responsivos con estado" y el bug real que esto causaba: cambiar de
    // ancho de ventana mostraba una categoría de producto distinta a la que se había elegido.
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

    const showProducts = mobileTab === TakeOrderMobileTabEnum.Products;

    return (
        <div className="flex flex-col h-full">
            {/* Layout único y responsivo: overlay de pantalla completa en mobile, en flujo
                normal desde lg — mismo patrón que QuickSaleContent.tsx. */}
            <div className="fixed inset-0 z-10 flex flex-col h-full overflow-hidden bg-stone-50 lg:static lg:z-auto">
                <div className="hidden lg:block">
                    <TakeOrderHeader
                        title={order?.nombre_pedido ?? "Tomar pedido"}
                        isReadOnly={isReadOnly}
                        onBack={handleBack}
                        onAddExtra={openExtra}
                        onMenuClick={toggleSidebar}
                        showAddExtra={showAddExtra}
                    />
                </div>
                <div className="lg:hidden">
                    <TakeOrderHeader
                        title={order?.nombre_pedido ?? "Tomar pedido"}
                        isReadOnly={isReadOnly}
                        onBack={handleBack}
                        onAddExtra={openExtra}
                        showAddExtra={showAddExtra}
                        compact
                    />
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className={`flex-1 overflow-hidden bg-stone-50 lg:border-r lg:border-stone-200 ${showProducts ? "" : "hidden lg:block"}`}>
                        {productGrid}
                    </div>
                    <div className={`w-full lg:w-80 xl:w-96 flex-shrink-0 overflow-hidden flex flex-col ${showProducts ? "hidden lg:flex" : ""}`}>
                        {cartPanel}
                    </div>
                </div>

                <div className="lg:hidden">
                    <TakeOrderMobileTabBar
                        activeTab={mobileTab}
                        cartCount={cartCount}
                        onTabChange={setMobileTab}
                    />
                </div>
            </div>

            <AddExtraModal isOpen={extraOpen} formik={extraFormik} onClose={closeExtra} />
        </div>
    );
}
