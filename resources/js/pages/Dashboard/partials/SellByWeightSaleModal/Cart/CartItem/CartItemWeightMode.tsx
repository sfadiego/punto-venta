import { IModalCartItem } from "@/models/IModalCartItem";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { ScaleReadButton } from "./ScaleReadButton";

interface CartItemWeightModeProps {
    item: IModalCartItem;
    displayQty: string;
    onQtyChange: (value: string) => void;
    onQtyBlur: () => void;
    unitLabel: string;
    lineTotal: string;
    isPeso: boolean;
    scaleSupported: boolean;
    isReadingScale: boolean;
    onReadScale: () => Promise<void>;
}

export const CartItemWeightMode = ({
    item, displayQty, onQtyChange, onQtyBlur,
    unitLabel, lineTotal, isPeso, scaleSupported,
    isReadingScale, onReadScale,
}: CartItemWeightModeProps) => (
    <>
        {isPeso && scaleSupported && (
            <ScaleReadButton isReading={isReadingScale} onRead={onReadScale} />
        )}
        <input
            type="number"
            value={displayQty}
            min={isPeso ? 0.001 : 1}
            step={item.product.unidad_medida === UnidadMedidaEnum.Kg ? 0.1 : 1}
            onChange={(e) => onQtyChange(e.target.value)}
            onBlur={onQtyBlur}
            className="w-14 lg:w-20 px-1 lg:px-1.5 py-2 lg:py-1 border border-stone-200 rounded-lg text-sm lg:text-xs text-center
                focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
        <span className="text-xs text-stone-400">{unitLabel}</span>
        <span className="text-xs font-bold text-amber-600">${lineTotal}</span>
    </>
);
