import { useEffect, useRef } from "react";
import { Loader, Package } from "lucide-react";
import { useQuickSaleContext } from "../../QuickSaleContext";
import { ProductCard } from "./ProductCard";

export const ProductGrid = () => {
    const {
        products,
        productsLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        addToCart,
        decrementFromCart,
        quantityOf,
        handleCardTap,
        stagedWeightKg,
    } = useQuickSaleContext();

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

    if (productsLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-40 rounded-2xl bg-stone-100 animate-pulse" />
                ))}
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-stone-400">
                <Package size={32} className="mb-2 opacity-40" />
                <p className="text-sm">No hay productos en esta categoría</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        quantity={quantityOf(product)}
                        onAdd={addToCart}
                        onDecrement={decrementFromCart}
                        onTap={handleCardTap}
                        hasStagedWeight={stagedWeightKg !== null}
                    />
                ))}
            </div>

            <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-2">
                {isFetchingNextPage && <Loader size={20} className="animate-spin text-stone-400" />}
            </div>
        </>
    );
};
