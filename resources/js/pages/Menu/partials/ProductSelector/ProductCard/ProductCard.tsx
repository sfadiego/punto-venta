import { useState } from "react";
import { Plus } from "lucide-react";
import { IMenuProduct } from "@/models/IMenu";
import { IProductVariant } from "@/models/IProductVariant";
import { isWeightUnit, formatPricePerUnit } from "@/utils/weightUnits";
import { UnitControls } from "@/components/ui/UnitControls";
import { VariantPickerModal } from "@/components/orders/VariantPickerModal/VariantPickerModal";
import { WeightControls } from "../WeightControls/WeightControls";
import { useProductCard } from "./useProductCard";
import { formatMoney } from "@/utils/formatCurrency";
import { ProductImagePlaceholder } from "./ProductImagePlaceholder";

interface ProductCardProps {
    product: IMenuProduct;
    quantity: number;
    quantityOf: (productId: number, variantId?: number | null) => number;
    primaryColor: string;
    readonly?: boolean;
    onAdd: (product: IMenuProduct, variant?: IProductVariant) => void;
    onRemove: (productId: number) => void;
    onAddWithWeight: (product: IMenuProduct, weight: number) => void;
}

export const ProductCard = ({
    product,
    quantity,
    quantityOf,
    primaryColor,
    readonly = false,
    onAdd,
    onRemove,
    onAddWithWeight,
}: ProductCardProps) => {
    const unit = product.unidad_medida;
    const byWeight = isWeightUnit(unit);
    const [imgError, setImgError] = useState(false);
    const {
        hasVariants,
        isPickerOpen,
        closePicker,
        handleAddClick,
        handleSelectVariant,
        isManagedStock,
        availableStock,
        stockExhausted,
        variantOptions,
    } = useProductCard(product, quantity, quantityOf, onAdd);

    return (
        <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden flex flex-col active:scale-[0.98] transition-transform">
            {product.image_url && !imgError ? (
                <img
                    src={product.image_url}
                    alt={product.nombre}
                    className="w-full h-32 sm:h-40 object-cover"
                    loading="lazy"
                    onError={() => setImgError(true)}
                />
            ) : (
                <ProductImagePlaceholder iconName={product.icon_name} iconSource={product.icon_source} />
            )}

            <div className="p-3 flex flex-col gap-2.5 flex-1">
                <div className="flex-1">
                    {byWeight ? (
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <p className="text-sm font-semibold text-stone-800 leading-snug">{product.nombre}</p>
                            <span className="text-xs font-bold text-stone-600 tabular-nums shrink-0 ml-auto">
                                {formatPricePerUnit(product.precio, unit)}
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm font-semibold text-stone-800 leading-snug">{product.nombre}</p>
                    )}
                    {product.descripcion && (
                        <p className="text-xs text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {product.descripcion}
                        </p>
                    )}

                    {/* Aviso de stock en la card, no como toast — mismo patrón que QuickSale */}
                    {stockExhausted && (
                        <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide mt-1">
                            {quantity > 0 ? "Ya agregaste todo el stock disponible" : "Sin stock"}
                        </p>
                    )}
                </div>

                <div className={`flex gap-2 mt-auto ${byWeight ? "flex-col items-stretch" : "items-center justify-between"}`}>
                    {!byWeight && (
                        <span className="text-sm font-bold text-stone-800 tabular-nums">
                            {`$${formatMoney(product.precio)}`}
                        </span>
                    )}

                    {readonly ? null : byWeight ? (<WeightControls
                        cantidad={quantity}
                        unit={unit}
                        precio={product.precio}
                        primaryColor={primaryColor}
                        maxWeight={isManagedStock ? availableStock : undefined}
                        onChangeWeight={(w) => onAddWithWeight(product, w)}
                    />) : hasVariants ? (
                        <button
                            onClick={handleAddClick}
                            disabled={stockExhausted}
                            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white transition-opacity active:opacity-70 shrink-0 disabled:bg-stone-300 disabled:cursor-not-allowed disabled:active:opacity-100"
                            style={stockExhausted ? undefined : { backgroundColor: primaryColor }}
                            aria-label={`Elegir variante de ${product.nombre}`}
                        >
                            <Plus size={18} />
                            {quantity > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-white text-stone-800 rounded-full text-[10px] flex items-center justify-center font-bold leading-none shadow">
                                    {quantity}
                                </span>
                            )}
                        </button>
                    ) : (
                        quantity === 0 ? (
                            <button
                                onClick={handleAddClick}
                                disabled={stockExhausted}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-opacity active:opacity-70 shrink-0 disabled:bg-stone-300 disabled:cursor-not-allowed disabled:active:opacity-100"
                                style={stockExhausted ? undefined : { backgroundColor: primaryColor }}
                                aria-label={`Agregar ${product.nombre}`}
                            >
                                <Plus size={18} />
                            </button>
                        ) : (
                            <UnitControls
                                quantity={quantity}
                                primaryColor={primaryColor}
                                onAdd={handleAddClick}
                                onRemove={() => onRemove(product.id)}
                                disableAdd={stockExhausted}
                            />
                        )
                    )}
                </div>
            </div>

            <VariantPickerModal
                isOpen={isPickerOpen}
                title={product.nombre}
                options={variantOptions}
                onSelect={handleSelectVariant}
                onClose={closePicker}
            />
        </div>
    );
};
