import { Plus, Minus } from "lucide-react";
import { IMenuProduct } from "@/models/IMenu";

interface ProductCardProps {
    product: IMenuProduct;
    quantity: number;
    primaryColor: string;
    onAdd: (product: IMenuProduct) => void;
    onRemove: (productId: number) => void;
}

export const ProductCard = ({ product, quantity, primaryColor, onAdd, onRemove }: ProductCardProps) => (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden flex flex-col active:scale-[0.98] transition-transform">
        {product.image_url ? (
            <img
                src={product.image_url}
                alt={product.nombre}
                className="w-full h-32 sm:h-40 object-cover"
                loading="lazy"
            />
        ) : (
            <div className="w-full h-32 sm:h-40 bg-stone-50 flex items-center justify-center">
                <span className="text-4xl text-stone-200">🍽️</span>
            </div>
        )}

        <div className="p-3 flex flex-col gap-2.5 flex-1">
            <div className="flex-1">
                <p className="text-sm font-semibold text-stone-800 leading-snug">{product.nombre}</p>
                {product.descripcion && (
                    <p className="text-xs text-stone-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {product.descripcion}
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between gap-2 mt-auto">
                <span className="text-sm font-bold text-stone-800 tabular-nums">
                    ${product.precio.toFixed(2)}
                </span>

                {quantity === 0 ? (
                    <button
                        onClick={() => onAdd(product)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-opacity active:opacity-70"
                        style={{ backgroundColor: primaryColor }}
                        aria-label={`Agregar ${product.nombre}`}
                    >
                        <Plus size={18} />
                    </button>
                ) : (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onRemove(product.id)}
                            className="w-9 h-9 rounded-xl bg-stone-100 active:bg-stone-200 flex items-center justify-center transition-colors"
                            aria-label="Quitar uno"
                        >
                            <Minus size={14} className="text-stone-600" />
                        </button>
                        <span className="text-sm font-semibold text-stone-800 w-5 text-center tabular-nums">
                            {quantity}
                        </span>
                        <button
                            onClick={() => onAdd(product)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity active:opacity-70"
                            style={{ backgroundColor: primaryColor }}
                            aria-label="Agregar uno"
                        >
                            <Plus size={14} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    </div>
);
