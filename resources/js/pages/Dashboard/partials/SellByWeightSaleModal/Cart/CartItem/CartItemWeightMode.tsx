import { IModalCartItem } from "@/models/IModalCartItem";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { ScaleReadButton } from "./ScaleReadButton";

interface CartItemWeightModeProps {
    item: IModalCartItem;
    displayQty: string;
    onQtyChange: (value: string) => void;
    onQtyBlur: () => void;
    unitLabel: string;
    isPeso: boolean;
    canUseScale: boolean;
    scaleSupported: boolean;
    isReadingScale: boolean;
    onReadScale: () => Promise<void>;
}

export const CartItemWeightMode = ({
    item, displayQty, onQtyChange, onQtyBlur,
    unitLabel, isPeso, canUseScale, scaleSupported,
    isReadingScale, onReadScale,
}: CartItemWeightModeProps) => (
    <>
        {canUseScale && scaleSupported && (
            <ScaleReadButton isReading={isReadingScale} onRead={onReadScale} />
        )}
        <input
            type="number"
            value={displayQty}
            min={isPeso ? 0.001 : 1}
            step={
                item.product.unidad_medida === UnidadMedidaEnum.Kg ||
                item.product.unidad_medida === UnidadMedidaEnum.Litro
                    ? 0.1
                    : 1
            }
            onChange={(e) => onQtyChange(e.target.value)}
            onBlur={onQtyBlur}
            className="w-20 lg:w-20 shrink-0 px-1 lg:px-1.5 py-2 lg:py-1 border border-stone-200 rounded-lg text-sm lg:text-xs text-center
                focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <span className="shrink-0 text-xs text-stone-400">{unitLabel}</span>
    </>
);
