import { Loader } from "lucide-react";
import { IMenuCategory, IMenuProduct } from "@/services/useMenuService";
import { ProductCard } from "./ProductCard";

interface ProductGridProps {
    categories: IMenuCategory[];
    primaryColor: string;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    sentinelRef: React.RefObject<HTMLDivElement | null>;
    quantityOf: (id: number) => number;
    onAdd: (product: IMenuProduct) => void;
    onRemove: (productId: number) => void;
}

export const ProductGrid = ({
    categories,
    primaryColor,
    isFetchingNextPage,
    hasNextPage,
    sentinelRef,
    quantityOf,
    onAdd,
    onRemove,
}: ProductGridProps) => {
    if (categories.length === 0 && !isFetchingNextPage) {
        return (
            <div className="text-center py-16 text-stone-400 text-sm">
                No se encontraron productos.
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {categories.map((category) => (
                <section key={category.id}>
                    <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
                        {category.nombre}
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {category.products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                quantity={quantityOf(product.id)}
                                primaryColor={primaryColor}
                                onAdd={onAdd}
                                onRemove={onRemove}
                            />
                        ))}
                    </div>
                </section>
            ))}

            {/* Sentinel — activa la carga de la siguiente página */}
            <div ref={sentinelRef} className="h-4" />

            {isFetchingNextPage && (
                <div className="flex justify-center py-4">
                    <Loader size={20} className="animate-spin text-stone-400" />
                </div>
            )}

            {!hasNextPage && categories.length > 0 && (
                <p className="text-center text-xs text-stone-300 py-2">
                    Todos los productos cargados
                </p>
            )}
        </div>
    );
};
