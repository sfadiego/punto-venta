import { Trash2, Loader, Weight } from "lucide-react";
import { IModalCartItem } from "@/models/IModalCartItem";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { calcWeightFromPrice } from "@/utils/calcWeightFromPrice";
import { WeightModeToggle } from "@/components/ui/WeightModeToggle";
import { isPeso, useNewSaleCartItem } from "./useNewSaleCartItem";

interface NewSaleCartItemProps {
    item: IModalCartItem;
    mode: WeightInputModeEnum;
    displayQty: string;
    displayPrice: string;
    onModeToggle: () => void;
    onQtyChange: (value: string) => void;
    onQtyBlur: () => void;
    onPriceChange: (value: string) => void;
    onPriceBlur: () => void;
    onRemove: () => Promise<void>;
    onReadScale: () => Promise<void>;
    scaleSupported: boolean;
}

export const NewSaleCartItem = ({
    item, mode,
    displayQty, displayPrice,
    onModeToggle,
    onQtyChange, onQtyBlur,
    onPriceChange, onPriceBlur,
    onRemove,
    onReadScale, scaleSupported,
}: NewSaleCartItemProps) => {
    const {
        isRemoving, handleRemove,
        isReadingScale, handleReadScale,
        canToggle, unitLabel, lineTotal,
    } = useNewSaleCartItem({ item, onRemove, onReadScale });

    return (
        <div className="
            flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-4 py-2 border-b border-stone-100 last:border-0
            sm:rounded-xl sm:bg-stone-50 sm:border sm:border-stone-100 sm:p-3 sm:mb-2 sm:last:mb-0
        ">
            <p className="flex-1 min-w-[6rem] text-xs font-semibold text-stone-900 truncate">
                {item.product.nombre}
            </p>

            <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
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

                {mode === WeightInputModeEnum.Weight ? (
                    <>
                        {isPeso(item) && scaleSupported && (
                            <button
                                type="button"
                                onClick={handleReadScale}
                                disabled={isReadingScale}
                                title="Leer báscula"
                                className="flex items-center justify-center w-9 h-9 lg:w-6 lg:h-6 rounded-md
                                    text-amber-500 bg-amber-50 hover:bg-amber-100
                                    transition-colors shrink-0 disabled:cursor-wait disabled:opacity-60"
                            >
                                {isReadingScale ? (
                                    <Loader size={18} className="animate-spin lg:hidden" />
                                ) : (
                                    <Weight size={18} className="lg:hidden" />
                                )}
                                {isReadingScale ? (
                                    <Loader size={12} className="animate-spin hidden lg:block" />
                                ) : (
                                    <Weight size={12} className="hidden lg:block" />
                                )}
                            </button>
                        )}
                        <input
                            type="number"
                            value={displayQty}
                            min={isPeso(item) ? 0.001 : 1}
                            step={item.product.unidad_medida === UnidadMedidaEnum.Kg ? 0.1 : 1}
                            onChange={(e) => onQtyChange(e.target.value)}
                            onBlur={onQtyBlur}
                            className="w-16 lg:w-20 px-1.5 py-2 lg:py-1 border border-stone-200 rounded-lg text-sm lg:text-xs text-center
                                focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <span className="text-xs text-stone-400">{unitLabel}</span>
                        <span className="text-xs font-bold text-amber-600">
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
                            className="w-20 lg:w-24 px-1.5 py-2 lg:py-1 border border-amber-300 rounded-lg text-sm lg:text-xs text-center
                                focus:outline-none focus:ring-2 focus:ring-amber-400"
                        />
                        <span className="text-xs text-stone-400">
                            {item.product.precio > 0
                                ? `${calcWeightFromPrice(displayPrice, item.product.precio).toFixed(3)} ${unitLabel}`
                                : `— ${unitLabel}`}
                        </span>
                    </>
                )}

                <button
                    onClick={handleRemove}
                    disabled={isRemoving}
                    className="flex items-center justify-center w-9 h-9 lg:w-6 lg:h-6 rounded-md
                        text-red-300 bg-red-50 hover:text-red-500 hover:bg-red-100
                        transition-colors shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {isRemoving ? (
                        <Loader size={18} className="animate-spin lg:hidden" />
                    ) : (
                        <Trash2 size={18} className="lg:hidden" />
                    )}
                    {isRemoving ? (
                        <Loader size={12} className="animate-spin hidden lg:block" />
                    ) : (
                        <Trash2 size={12} className="hidden lg:block" />
                    )}
                </button>
            </div>
        </div>
    );
};
