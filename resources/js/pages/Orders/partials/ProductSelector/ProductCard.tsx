import { Loader } from "lucide-react";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { CatalogIcon } from "@/components/ui/CatalogIcon";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { useProductCard } from "./useProductCard";
import { VariantPickerModal } from "./VariantPickerModal";

interface ProductCardProps {
    product: IProduct;
    quantityInCart: number;
    isReadOnly?: boolean;
    isPending?: boolean;
    onAdd: (
        productId: number,
        name: string,
        price: number,
        variantId?: number | null,
        variantName?: string | null,
    ) => void | Promise<void>;
}

export const ProductCard = ({
    product,
    quantityInCart,
    isReadOnly = false,
    isPending = false,
    onAdd,
}: ProductCardProps) => {
    const { isPickerOpen, closePicker, handleClick, handleSelectVariant, stockExhausted } = useProductCard(
        product,
        quantityInCart,
        onAdd,
    );
    const disabled = isReadOnly || isPending || stockExhausted;
    const inCart = quantityInCart > 0;

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => {
                        if (disabled) return;
                        handleClick();
                    }}
                    disabled={disabled}
                    className={`relative overflow-hidden bg-white rounded-2xl border p-4 text-left shadow-sm transition-all w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                        isReadOnly || stockExhausted
                            ? "border-stone-100 opacity-70 cursor-not-allowed"
                            : isPending
                              ? "border-amber-300 opacity-70 cursor-wait"
                              : inCart
                                ? "border-amber-400 hover:shadow-md active:scale-95"
                                : "border-stone-100 hover:border-amber-200 hover:shadow-md active:scale-95"
                    }`}
                >
                    {/* Ícono como marca de agua — mismo patrón que QuickSale/ProductGrid/ProductCard */}
                    <CatalogIcon
                        iconName={product.icon_name}
                        iconSource={product.icon_source}
                        size={88}
                        className="absolute -right-2 -top-2 text-stone-200 opacity-25 pointer-events-none"
                    />

                    <div className="relative flex flex-col gap-2">
                        <p className="text-sm font-semibold text-stone-900 leading-tight truncate">{product.nombre}</p>
                        <p className="text-xl font-extrabold tabular-nums" style={{ color: "var(--color-primary)" }}>
                            {formatCurrencyTrimmed(product.precio)}
                        </p>
                        {stockExhausted && (
                            <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide -mt-1">
                                {inCart ? "Ya agregaste todo el stock" : "Sin stock"}
                            </p>
                        )}
                    </div>
                </button>

                {/* Badge fuera del overflow-hidden del botón — así puede sobresalir de la
                    esquina redondeada en vez de quedar recortado junto con la marca de agua. */}
                {inCart && !isPending && (
                    <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 bg-amber-500 text-white rounded-full text-xs flex items-center justify-center font-bold leading-none shadow-sm pointer-events-none">
                        {quantityInCart}
                    </span>
                )}
                {isPending && (
                    <span className="absolute -top-2 -right-2 w-[22px] h-[22px] bg-amber-400 text-white rounded-full flex items-center justify-center shadow-sm pointer-events-none">
                        <Loader size={12} className="animate-spin" />
                    </span>
                )}
            </div>

            <VariantPickerModal
                isOpen={isPickerOpen}
                product={product}
                onSelect={(variant: IProductVariant) => handleSelectVariant(variant)}
                onClose={closePicker}
            />
        </>
    );
};
