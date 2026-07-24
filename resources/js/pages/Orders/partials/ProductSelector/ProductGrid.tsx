import { useRef, useEffect } from "react";
import { Search, Package, Loader } from "lucide-react";
import { ICartItem } from "@/models/ICartItem";
import { getCartQuantityForProduct } from "@/utils/cartCalc";
import { useProductGrid } from "./useProductGrid";
import { CategoryTabs } from "./CategoryTabs";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
    cart: ICartItem[];
    isReadOnly?: boolean;
    pendingProductIds?: Set<number>;
    onAdd: (productId: number, name: string, price: number) => void;
}

export const ProductGrid = ({ cart, isReadOnly = false, pendingProductIds, onAdd }: ProductGridProps) => {
    const {
        search,
        setSearch,
        activeCategory,
        setActiveCategory,
        categories,
        products,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useProductGrid();

    const sentinelRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Buscador + Tabs — fijos */}
            <div className="flex-shrink-0 bg-white border-b border-stone-100">
                <div className="px-4 pt-4 pb-3">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                        />
                        <input
                            type="text"
                            placeholder="Buscar producto..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-stone-50"
                        />
                    </div>
                </div>
                <div className="px-3 pb-3">
                    <CategoryTabs
                        categories={categories}
                        activeCategory={activeCategory}
                        onSelect={setActiveCategory}
                    />
                </div>
            </div>

            {/* Productos — área con scroll */}
            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="h-28 rounded-2xl bg-stone-200 animate-pulse" />
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-stone-400">
                        <Package size={32} className="mb-2 opacity-40" />
                        <p className="text-sm">No se encontraron productos</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    quantityInCart={getCartQuantityForProduct(cart, product.id)}
                                    isReadOnly={isReadOnly}
                                    isPending={pendingProductIds?.has(product.id)}
                                    onAdd={onAdd}
                                />
                            ))}
                        </div>

                        {/* Sentinel para infinite scroll */}
                        <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-2">
                            {isFetchingNextPage && (
                                <Loader size={20} className="animate-spin text-stone-400" />
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
