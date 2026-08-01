import { IModalCartItem } from "@/models/IModalCartItem";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { WeightModeToggle } from "@/components/ui/WeightModeToggle";
import { isPeso, isScaleWeighable, useNewSaleCartItem } from "./useNewSaleCartItem";
import { CartItemWeightMode } from "./CartItemWeightMode";
import { CartItemPriceMode } from "./CartItemPriceMode";
import { CartItemDeleteButton } from "./CartItemDeleteButton";

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
            flex flex-wrap min-w-0 items-center justify-between gap-x-1.5 gap-y-1.5
            rounded-xl bg-stone-50 border border-stone-200 p-3 mb-2 last:mb-0 lg:gap-x-2
        ">
            <div className="flex w-full min-w-0 items-center justify-between gap-2">
                <p className="min-w-0 flex-1 text-xs font-semibold text-stone-900 truncate">
                    {item.product.nombre}
                </p>
                <span className="shrink-0 text-xs font-bold text-amber-600">
                    ${lineTotal}
                </span>
            </div>

            <div className="flex w-full min-w-0 items-center gap-1 lg:gap-1.5 flex-wrap justify-end">
                {canToggle && (
                    <div className="shrink-0">
                        <WeightModeToggle
                            mode={mode}
                            weightLabel={unitLabel}
                            onSelectWeight={onModeToggle}
                            onSelectPrice={onModeToggle}
                            color="amber"
                            size="sm"
                        />
                    </div>
                )}

                {mode === WeightInputModeEnum.Weight ? (
                    <CartItemWeightMode
                        item={item}
                        displayQty={displayQty}
                        onQtyChange={onQtyChange}
                        onQtyBlur={onQtyBlur}
                        unitLabel={unitLabel}
                        isPeso={isPeso(item)}
                        canUseScale={isScaleWeighable(item)}
                        scaleSupported={scaleSupported}
                        isReadingScale={isReadingScale}
                        onReadScale={handleReadScale}
                    />
                ) : (
                    <CartItemPriceMode
                        displayPrice={displayPrice}
                        onPriceChange={onPriceChange}
                        onPriceBlur={onPriceBlur}
                        unitLabel={unitLabel}
                        catalogPrice={item.product.precio}
                    />
                )}

                <CartItemDeleteButton isRemoving={isRemoving} onRemove={handleRemove} />
            </div>
        </div>
    );
};
