import { Trash2 } from "lucide-react";
import { ModalCartItem } from "./useSellByWeightSaleModal";
import { UNIDAD_LABELS, UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { calcWeightFromPrice } from "@/utils/calcWeightFromPrice";
import { WeightModeToggle } from "@/components/ui/WeightModeToggle";

const isPeso = (item: ModalCartItem) =>
    item.product.unidad_medida === UnidadMedidaEnum.Kg ||
    item.product.unidad_medida === UnidadMedidaEnum.Gr;

interface NewSaleCartItemProps {
    item: ModalCartItem;
    mode: WeightInputModeEnum;
    displayQty: string;
    displayPrice: string;
    onModeToggle: () => void;
    onQtyChange: (value: string) => void;
    onQtyBlur: () => void;
    onPriceChange: (value: string) => void;
    onPriceBlur: () => void;
    onRemove: () => void;
}

export const NewSaleCartItem = ({
    item, mode,
    displayQty, displayPrice,
    onModeToggle,
    onQtyChange, onQtyBlur,
    onPriceChange, onPriceBlur,
    onRemove,
}: NewSaleCartItemProps) => {
    const canToggle = isPeso(item);
    const unitLabel = UNIDAD_LABELS[item.product.unidad_medida];
    const lineTotal = (item.precioEfectivo * item.cantidad).toFixed(2);

    return (
        <div className="
            flex items-center gap-2 px-4 py-2 border-b border-stone-100 last:border-0
            sm:flex-col sm:items-stretch sm:gap-1.5 sm:p-3 sm:rounded-xl sm:bg-stone-50 sm:border sm:border-stone-100 sm:mb-2 sm:last:mb-0
        ">
            <div className="flex items-center justify-between sm:justify-start gap-1.5">
                <p className="flex-1 text-xs font-semibold text-stone-900 truncate">
                    {item.product.nombre}
                </p>

                {canToggle && (
                    <WeightModeToggle
                        mode={mode}
                        weightLabel={unitLabel}
                        onSelectWeight={onModeToggle}
                        onSelectPrice={onModeToggle}
                        color="amber"
                        size="sm"
                    />
                )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
                {mode === WeightInputModeEnum.Weight ? (
                    <>
                        <input
                            type="number"
                            value={displayQty}
                            min={isPeso(item) ? 0.001 : 1}
                            step={item.product.unidad_medida === UnidadMedidaEnum.Kg ? 0.1 : 1}
                            onChange={(e) => onQtyChange(e.target.value)}
                            onBlur={onQtyBlur}
                            className="w-14 sm:w-20 px-1.5 py-1 border border-stone-200 rounded-lg text-xs text-center
                                focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <span className="text-xs text-stone-400">{unitLabel}</span>
                        <span className="flex-1 text-xs font-bold text-amber-600 text-right">
                            ${lineTotal}
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-xs text-stone-400">$</span>
                        <input
                            type="number"
                            value={displayPrice}
                            min={0.01}
                            step={0.5}
                            onChange={(e) => onPriceChange(e.target.value)}
                            onBlur={onPriceBlur}
                            className="w-20 sm:w-24 px-1.5 py-1 border border-amber-300 rounded-lg text-xs text-center
                                focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <span className="flex-1 text-xs text-stone-400 text-right">
                            {item.product.precio > 0
                                ? `${calcWeightFromPrice(displayPrice, item.product.precio).toFixed(3)} ${unitLabel}`
                                : `— ${unitLabel}`}
                        </span>
                    </>
                )}

                <button
                    onClick={onRemove}
                    className="flex items-center justify-center w-6 h-6 rounded-md
                        text-red-300 bg-red-50 hover:text-red-500 hover:bg-red-100
                        transition-colors shrink-0"
                >
                    <Trash2 size={12} />
                </button>
            </div>
        </div>
    );
};
