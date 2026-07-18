import { useState } from "react";
import { Plus } from "lucide-react";
import { IMenuProduct } from "@/models/IMenu";
import { isWeightUnit, formatPricePerUnit } from "@/utils/weightUnits";
import { WeightControls } from "./WeightControls";
import { UnitControls } from "./UnitControls";

interface ProductCardProps {
    product: IMenuProduct;
    quantity: number;
    primaryColor: string;
    onAdd: (product: IMenuProduct) => void;
    onRemove: (productId: number) => void;
}

const Placeholder = () => (
    <div className="w-full h-32 sm:h-40 bg-stone-50 flex items-center justify-center">
        <span className="text-4xl text-stone-200">🍽️</span>
    </div>
);

export const ProductCard = ({ product, quantity, primaryColor, onAdd, onRemove }: ProductCardProps) => {
    const unit = product.unidad_medida;
    const byWeight = isWeightUnit(unit);
    const [imgError, setImgError] = useState(false);
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
                <Placeholder />
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
                </div>

                <div className={`flex gap-2 mt-auto ${byWeight ? "flex-col items-stretch" : "items-center justify-between"}`}>
                    {!byWeight && (
                        <span className="text-sm font-bold text-stone-800 tabular-nums">
                            {`$${product.precio.toFixed(2)}`}
                        </span>
                    )}

                    {byWeight ? (
                        quantity === 0 ? (
                            <button
                                onClick={() => onAdd(product)}
                                className="w-full py-2 rounded-xl text-white text-xs font-semibold transition-opacity active:opacity-70 flex items-center justify-center gap-1"
                                style={{ backgroundColor: primaryColor }}
                                aria-label={`Agregar ${product.nombre}`}
                            >
                                <Plus size={14} />
                                Agregar
                            </button>
                        ) : (
                            <WeightControls
                                cantidad={quantity}
                                unit={unit}
                                precio={product.precio}
                                primaryColor={primaryColor}
                                onAdd={() => onAdd(product)}
                                onRemove={() => onRemove(product.id)}
                            />
                        )
                    ) : (
                        quantity === 0 ? (
                            <button
                                onClick={() => onAdd(product)}
                                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-opacity active:opacity-70 shrink-0"
                                style={{ backgroundColor: primaryColor }}
                                aria-label={`Agregar ${product.nombre}`}
                            >
                                <Plus size={18} />
                            </button>
                        ) : (
                            <UnitControls
                                quantity={quantity}
                                primaryColor={primaryColor}
                                onAdd={() => onAdd(product)}
                                onRemove={() => onRemove(product.id)}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
