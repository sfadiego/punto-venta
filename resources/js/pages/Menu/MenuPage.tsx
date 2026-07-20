import { useMenuPage } from "./useMenuPage";
import { MenuHeader } from "./partials/MenuHeader";
import { CategoryFilter } from "./partials/ProductSelector/CategoryFilter";
import { ProductGrid } from "./partials/ProductSelector/ProductGrid";
import { CartButton } from "./partials/Cart/CartButton";
import { CartDrawer } from "./partials/Cart/CartDrawer";
import { CheckoutModal } from "./partials/Checkout/CheckoutModal";
import { BusinessClosed } from "./partials/BusinessClosed";
import { OrderingDisabled } from "./partials/OrderingDisabled";

function MenuPage() {
    const {
        slug,
        business,
        isLoading,
        categories,
        filteredCategories,
        isFetchingNextPage,
        hasNextPage,
        sentinelRef,
        search,
        setSearch,
        activeCategoryId,
        setActiveCategoryId,
        cart,
        cartOpen,
        setCartOpen,
        checkoutOpen,
        setCheckoutOpen,
    } = useMenuPage();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center bg-stone-50" style={{ position: "fixed", inset: 0 }}>
                <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!business) {
        return (
            <div className="flex items-center justify-center bg-stone-50" style={{ position: "fixed", inset: 0 }}>
                <p className="text-stone-400 text-sm">Negocio no encontrado.</p>
            </div>
        );
    }

    if (!business.menu_enabled) {
        return <OrderingDisabled business={business} />;
    }

    if (!business.has_active_session) {
        return <BusinessClosed business={business} />;
    }

    return (
        <div className="flex flex-col bg-stone-50" style={{ position: "fixed", inset: 0 }}>
            <MenuHeader business={business} search={search} onSearch={setSearch} />

            <CategoryFilter
                categories={categories}
                activeId={activeCategoryId}
                onSelect={setActiveCategoryId}
                primaryColor={business.primary_color}
            />

            <main className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto px-4 pt-4 pb-32">
                    <ProductGrid
                        categories={filteredCategories}
                        primaryColor={business.primary_color}
                        isFetchingNextPage={isFetchingNextPage}
                        hasNextPage={!!hasNextPage}
                        sentinelRef={sentinelRef}
                        quantityOf={cart.quantityOf}
                        onAdd={cart.add}
                        onRemove={cart.remove}
                        onAddWithWeight={cart.addWithWeight}
                    />
                </div>
            </main>

            <CartButton
                count={cart.count}
                total={cart.total}
                primaryColor={business.primary_color}
                onClick={() => setCartOpen(true)}
            />

            <CartDrawer
                open={cartOpen}
                items={cart.items}
                total={cart.total}
                primaryColor={business.primary_color}
                onClose={() => setCartOpen(false)}
                onAdd={cart.add}
                onRemove={cart.remove}
                onDelete={cart.deleteItem}
                onSetWeight={cart.setWeight}
                onNote={cart.setNote}
                onCheckout={() => { setCartOpen(false); setCheckoutOpen(true); }}
            />

            <CheckoutModal
                open={checkoutOpen}
                slug={slug}
                items={cart.items}
                deliveryCost={business.costo_domicilio_default}
                primaryColor={business.primary_color}
                onClose={() => setCheckoutOpen(false)}
                onSuccess={cart.clear}
            />
        </div>
    );
}

export default MenuPage;
