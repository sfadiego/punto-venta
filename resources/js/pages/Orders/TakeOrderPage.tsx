import { useState } from "react";
import { ShoppingCart, ChevronLeft, Package, Lock, PackagePlus, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLayout } from "@/contexts/LayoutContext";
import { useIndexProducts } from "@/services/useProductService";
import { useTakeOrder } from "./useTakeOrder";
import { ProductGrid } from "./partials/ProductGrid";
import { CartPanel } from "./partials/CartPanel";
import { AddExtraModal } from "./partials/AddExtraModal";
import { useAddExtraModal } from "./partials/useAddExtraModal";

export default function TakeOrderPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { toggleSidebar } = useLayout();
    const [mobileTab, setMobileTab] = useState<"products" | "cart">("products");

    const handleBack = () => {
        queryClient.invalidateQueries({ queryKey: ["orders-infinite"] });
        navigate(-1);
    };

    const {
        order,
        cart,
        cartCount,
        subtotal,
        loadingCart,
        isReadOnly,
        addToCart,
        addExtra,
        updateQuantity,
        saveObservacion,
        removeFromCart,
        clearCart,
    } = useTakeOrder();

    const { isOpen: extraOpen, openModal: openExtra, handleClose: closeExtra, formik: extraFormik } =
        useAddExtraModal(addExtra);

    const { data: productsPage, isLoading: loadingProducts } = useIndexProducts({ limit: 200 });
    const products = productsPage?.data ?? [];

    return (
        <div className="flex flex-col h-full">
            {/* Desktop */}
            <div className="hidden lg:flex flex-col h-full overflow-hidden">
                <Header
                    title={order?.nombre_pedido ?? "Tomar pedido"}
                    isReadOnly={isReadOnly}
                    onBack={handleBack}
                    onAddExtra={openExtra}
                    onMenuClick={toggleSidebar}
                />
                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 overflow-hidden bg-stone-50 border-r border-stone-200">
                        <ProductGrid
                            products={products}
                            isLoading={loadingProducts}
                            cart={cart}
                            isReadOnly={isReadOnly}
                            onAdd={addToCart}
                        />
                    </div>
                    <div className="w-80 xl:w-96 flex-shrink-0 overflow-hidden flex flex-col">
                        <CartPanel
                            order={order}
                            cart={cart}
                            subtotal={subtotal}
                            isLoading={loadingCart}
                            isReadOnly={isReadOnly}
                            onUpdate={updateQuantity}
                            onRemove={removeFromCart}
                            onNote={saveObservacion}
                            onClear={clearCart}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile — overlay de pantalla completa independiente del layout padre */}
            <div className="lg:hidden fixed inset-0 z-10 flex flex-col bg-stone-50">
                <Header
                    title={order?.nombre_pedido ?? "Tomar pedido"}
                    isReadOnly={isReadOnly}
                    onBack={handleBack}
                    onAddExtra={openExtra}
                    compact
                />
                <div className="flex-1 overflow-y-auto">
                    {mobileTab === "products" ? (
                        <ProductGrid
                            products={products}
                            isLoading={loadingProducts}
                            cart={cart}
                            isReadOnly={isReadOnly}
                            onAdd={addToCart}
                        />
                    ) : (
                        <CartPanel
                            order={order}
                            cart={cart}
                            subtotal={subtotal}
                            isLoading={loadingCart}
                            isReadOnly={isReadOnly}
                            onUpdate={updateQuantity}
                            onRemove={removeFromCart}
                            onNote={saveObservacion}
                            onClear={clearCart}
                        />
                    )}
                </div>
                <MobileTabBar
                    activeTab={mobileTab}
                    cartCount={cartCount}
                    onTabChange={setMobileTab}
                />
            </div>

            <AddExtraModal isOpen={extraOpen} formik={extraFormik} onClose={closeExtra} />
        </div>
    );
}

interface HeaderProps {
    title: string;
    isReadOnly: boolean;
    onBack: () => void;
    onAddExtra: () => void;
    onMenuClick?: () => void;
    compact?: boolean;
}

const Header = ({ title, isReadOnly, onBack, onAddExtra, onMenuClick, compact = false }: HeaderProps) => (
    <div
        className={`bg-white border-b border-stone-200 flex items-center gap-3 flex-shrink-0 ${
            compact ? "px-4 py-3.5" : "px-6 py-4"
        }`}
    >
        {onMenuClick && (
            <button
                onClick={onMenuClick}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors"
                aria-label="Abrir menú"
            >
                <Menu size={20} />
            </button>
        )}
        <button
            onClick={onBack}
            className={`p-1.5 rounded-lg hover:bg-stone-100 text-stone-500 transition-colors ${compact ? "-ml-1" : ""}`}
        >
            <ChevronLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                <h1 className={`font-semibold text-stone-900 truncate ${compact ? "text-sm" : ""}`}>
                    {title}
                </h1>
                {isReadOnly && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-500 text-xs font-medium shrink-0">
                        <Lock size={10} />
                        Solo lectura
                    </span>
                )}
            </div>
            {!compact && (
                <p className="text-stone-400 text-xs mt-0.5">
                    {isReadOnly
                        ? "Esta orden ya fue cerrada o cancelada"
                        : "Selecciona los productos del menú"}
                </p>
            )}
        </div>
        {!isReadOnly && (
            <button
                onClick={onAddExtra}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-600 font-medium text-xs transition-colors border border-violet-200 shrink-0"
            >
                <PackagePlus size={14} />
                {!compact && <span>Agregar extra</span>}
            </button>
        )}
    </div>
);

interface MobileTabBarProps {
    activeTab: "products" | "cart";
    cartCount: number;
    onTabChange: (tab: "products" | "cart") => void;
}

const MobileTabBar = ({ activeTab, cartCount, onTabChange }: MobileTabBarProps) => (
    <div className="bg-white border-t border-stone-200 flex flex-shrink-0 safe-area-bottom">
        <button
            onClick={() => onTabChange("products")}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors ${
                activeTab === "products" ? "text-amber-600" : "text-stone-400"
            }`}
        >
            <Package size={20} />
            Productos
        </button>
        <button
            onClick={() => onTabChange("cart")}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-medium transition-colors relative ${
                activeTab === "cart" ? "text-amber-600" : "text-stone-400"
            }`}
        >
            <div className="relative">
                <ShoppingCart size={20} />
                {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                        {cartCount > 9 ? "9+" : cartCount}
                    </span>
                )}
            </div>
            Pedido
        </button>
    </div>
);
