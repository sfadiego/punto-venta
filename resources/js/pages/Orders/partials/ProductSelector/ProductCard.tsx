import { ChevronRight, Loader } from "lucide-react";
import { ICartItem } from "@/models/ICartItem";
import { IProduct } from "@/models/IProduct";
import { CatalogIcon } from "@/components/ui/CatalogIcon";
import { VariantPickerModal } from "@/components/orders/VariantPickerModal/VariantPickerModal";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { useProductCard } from "./useProductCard";

interface ProductCardProps {
    product: IProduct;
    quantityInCart: number;
    cart: ICartItem[];
    isReadOnly?: boolean;
    isPending?: boolean;
    // "Ver variantes" en vez del precio base aplica a cualquier tipo de negocio cuando el
    // producto tiene variantes. El código de producto ("COD. XXXX") sigue siendo exclusivo de
    // retail. Se recibe como prop en vez de leer useAxios() aquí — TakeOrderPage ya lee
    // `features` una vez y lo pasa hacia abajo (ProductGrid).
    isRetail?: boolean;
    onAdd: (
        productId: number,
        name: string,
        price: number,
        variantId?: number | null,
        variantName?: string | null,
    ) => void | Promise<void>;
    onUpdateQuantity: (orderProductId: number, delta: number) => void;
}

export const ProductCard = ({
    product,
    quantityInCart,
    cart,
    isReadOnly = false,
    isPending = false,
    isRetail = false,
    onAdd,
    onUpdateQuantity,
}: ProductCardProps) => {
    const {
        isPickerOpen,
        closePicker,
        handleClick,
        handleAddVariant,
        handleRemoveVariant,
        stockExhausted,
        variantOptions,
    } = useProductCard(product, cart, onAdd, onUpdateQuantity);
    const disabled = isReadOnly || isPending || stockExhausted;
    const inCart = quantityInCart > 0;
    const hasVariants = (product.variants?.length ?? 0) > 0;

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => {
                        if (disabled) return;
                        handleClick();
                    }}
                    disabled={disabled}
                    className={`relative overflow-hidden bg-white rounded-2xl border p-4 text-left shadow-sm transition-all w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${isReadOnly || stockExhausted
                        ? "border-stone-100 opacity-70 cursor-not-allowed"
                        : isPending
                            ? "border-amber-300 opacity-70 cursor-wait"
                            : inCart
                                ? "border-amber-400 hover:shadow-md active:scale-95"
                                : "border-stone-100 hover:border-amber-200 hover:shadow-md active:scale-95"
                        }`}
                >
                    <CatalogIcon
                        iconName={product.icon_name}
                        iconSource={product.icon_source}
                        size={88}
                        className="absolute -right-2 -top-2 text-stone-200 opacity-25 pointer-events-none"
                    />

                    <div className="relative flex flex-col gap-2">
                        {/* line-clamp-2 en vez de truncate: los nombres largos se cortaban a una
                        sola línea sin forma de leer el resto (ej. "PARES ZAP INFANTE 17/21
                        CHAR/NEGRO M 1..."). Con 2 líneas los nombres cortos se ven igual que
                        antes; solo los largos ocupan más alto, sin afectar el resto de la grid. */}
                        <p
                            className="text-sm font-semibold text-stone-900 leading-tight line-clamp-2"
                            title={product.nombre}
                        >
                            {product.nombre}
                        </p>

                        {isRetail && product.product_code && (
                            <p className="text-[10px] font-semibold text-stone-400 tracking-wide -mt-1.5">
                                COD. {product.product_code}
                            </p>
                        )}

                        {!hasVariants ? (
                            <p className="text-xl font-extrabold tabular-nums flex items-center min-h-7" style={{ color: "var(--color-primary)" }}>
                                {formatCurrencyTrimmed(product.precio)}
                            </p>
                        ) : (
                            <div className="flex items-center gap-1 min-h-7 text-xs font-semibold text-stone-500">
                                Ver variantes
                                <ChevronRight size={13} className="text-stone-400" />
                            </div>
                        )}

                        {stockExhausted && (
                            <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide -mt-1">
                                {inCart ? "Ya agregaste todo el stock" : "Sin stock"}
                            </p>
                        )}
                    </div>
                </button>

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
                title={product.nombre}
                options={variantOptions}
                onAdd={handleAddVariant}
                onRemove={handleRemoveVariant}
                onClose={closePicker}
            />
        </>
    );
};
