import { Trash2 } from "lucide-react";
import { ModalCartItem } from "./useNewSaleModal";
import { UNIDAD_LABELS, UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";

const isPeso = (item: ModalCartItem) =>
    item.product.unidad_medida === UnidadMedidaEnum.Kg ||
    item.product.unidad_medida === UnidadMedidaEnum.Gr;

interface NewSaleCartItemProps {
    item: ModalCartItem;
    displayQty: string;
    onQtyChange: (value: string) => void;
    onQtyBlur: () => void;
    onRemove: () => void;
}

export const NewSaleCartItem = ({
    item, displayQty, onQtyChange, onQtyBlur, onRemove,
}: NewSaleCartItemProps) => {
    const price = (item.product.precio * item.cantidad).toFixed(2);

    return (
        <div className="
            flex items-center gap-2 px-4 py-2.5 border-b border-stone-100 last:border-0
            sm:flex-col sm:items-stretch sm:gap-1.5 sm:p-3 sm:rounded-xl sm:bg-stone-50 sm:border sm:border-stone-100 sm:mb-2 sm:last:mb-0
        ">
            <p className="flex-1 sm:flex-none text-xs font-semibold text-stone-900 truncate">
                {item.product.nombre}
            </p>

            {/* Controls row — qty + unit + price (mobile) + trash */}
            <div className="flex items-center gap-1.5 shrink-0">
                <input
                    type="number"
                    value={displayQty}
                    min={isPeso(item) ? 0.001 : 1}
                    step={isPeso(item) ? 0.1 : 1}
                    onChange={(e) => onQtyChange(e.target.value)}
                    onBlur={onQtyBlur}
                    className="w-14 sm:w-20 px-1.5 py-1 border border-stone-200 rounded-lg text-xs text-center
                        focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="text-xs text-stone-400">
                    {UNIDAD_LABELS[item.product.unidad_medida]}
                </span>
                <span className="text-xs font-bold text-amber-600 ml-1 sm:hidden">
                    ${price}
                </span>
                <button
                    onClick={onRemove}
                    className="flex items-center justify-center w-6 h-6 rounded-md
                        text-red-300 bg-red-50 hover:text-red-500 hover:bg-red-100
                        transition-colors ml-auto sm:ml-1 shrink-0"
                >
                    <Trash2 size={12} />
                </button>
            </div>

            {/* sm+: price on its own row */}
            <p className="hidden sm:block text-xs font-bold text-amber-600 text-right">
                ${price}
            </p>
        </div>
    );
};
