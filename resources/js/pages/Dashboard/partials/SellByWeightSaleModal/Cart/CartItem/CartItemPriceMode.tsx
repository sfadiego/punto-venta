import { calcWeightFromPrice } from "@/utils/calcWeightFromPrice";

interface CartItemPriceModeProps {
    displayPrice: string;
    onPriceChange: (value: string) => void;
    onPriceBlur: () => void;
    unitLabel: string;
    catalogPrice: number;
}

export const CartItemPriceMode = ({
    displayPrice, onPriceChange, onPriceBlur, unitLabel, catalogPrice,
}: CartItemPriceModeProps) => (
    <>
        <span className="shrink-0 text-xs text-stone-400">$</span>
        <input
            type="number"
            value={displayPrice}
            min={0.01}
            step={0.5}
            onChange={(e) => onPriceChange(e.target.value)}
            onBlur={onPriceBlur}
            className="w-16 lg:w-24 shrink-0 px-1 lg:px-1.5 py-2 lg:py-1 border border-amber-300 rounded-lg text-sm lg:text-xs text-center
                focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <span className="shrink-0 whitespace-nowrap text-right text-xs text-stone-400">
            {catalogPrice > 0
                ? `${calcWeightFromPrice(displayPrice, catalogPrice).toFixed(3)} ${unitLabel}`
                : `— ${unitLabel}`}
        </span>
    </>
);
