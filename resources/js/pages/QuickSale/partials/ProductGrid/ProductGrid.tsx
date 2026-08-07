import { Package } from "lucide-react";
import { useQuickSaleContext } from "../../QuickSaleContext";
import { ProductCard } from "./ProductCard";

export const ProductGrid = () => {
    const { products, productsLoading, addToCart, handleCardTap, stagedWeightKg } = useQuickSaleContext();

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
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    product={product}
                    onAdd={addToCart}
                    onTap={handleCardTap}
                    hasStagedWeight={stagedWeightKg !== null}
                />
            ))}
        </div>
    );
};
