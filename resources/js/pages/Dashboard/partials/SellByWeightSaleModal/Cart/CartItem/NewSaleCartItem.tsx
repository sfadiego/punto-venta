import { IModalCartItem } from "@/models/IModalCartItem";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { WeightModeToggle } from "@/components/ui/WeightModeToggle";
import { isPeso, useNewSaleCartItem } from "./useNewSaleCartItem";
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
            flex flex-wrap min-w-0 items-center justify-between gap-x-1.5 gap-y-1.5 px-3 py-2 border-b border-stone-100 last:border-0
            sm:rounded-xl sm:bg-stone-50 sm:border sm:border-stone-100 sm:p-3 sm:mb-2 sm:last:mb-0 sm:gap-x-2
        ">
            <p className="w-full sm:w-auto sm:flex-1 min-w-[6rem] text-xs font-semibold text-stone-900 truncate">
                {item.product.nombre}
            </p>

            <div className="flex w-full sm:w-auto sm:shrink-0 min-w-0 items-center gap-1 sm:gap-1.5 flex-wrap justify-end">
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
                    <CartItemWeightMode
                        item={item}
                        displayQty={displayQty}
                        onQtyChange={onQtyChange}
                        onQtyBlur={onQtyBlur}
                        unitLabel={unitLabel}
                        lineTotal={lineTotal}
                        isPeso={isPeso(item)}
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
