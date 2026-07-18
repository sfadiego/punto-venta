import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { WeightUnit } from "@/utils/weightUnits";

interface WeightControlsProps {
    cantidad: number;
    unit: WeightUnit;
    precio: number;
    primaryColor: string;
    onAdd: () => void;
    onRemove: () => void;
}

export const WeightControls = ({
    cantidad,
    unit,
    precio,
    primaryColor,
    onAdd,
    onRemove,
}: WeightControlsProps) => {
    const [mode, setMode] = useState<WeightInputModeEnum>(WeightInputModeEnum.Weight);

    const displayWeight =
        unit === UnidadMedidaEnum.Kg
            ? `${cantidad.toFixed(1)}`
            : `${Math.round(cantidad)}`;

    const displayPrice = `$${Math.round(cantidad * precio)}`;

    return (
        <div className="flex flex-col gap-1.5">
            {/* Toggle kg / $ */}
            <div className="flex justify-end">
                <div className="flex rounded-md overflow-hidden border border-stone-200 text-[10px] font-semibold">
                    <button
                        onClick={() => setMode(WeightInputModeEnum.Weight)}
                        className={`px-2.5 py-0.5 transition-colors ${
                            mode === WeightInputModeEnum.Weight
                                ? "bg-stone-800 text-white"
                                : "text-stone-400 hover:text-stone-600"
                        }`}
                    >
                        {unit}
                    </button>
                    <button
                        onClick={() => setMode(WeightInputModeEnum.Price)}
                        className={`px-2.5 py-0.5 transition-colors ${
                            mode === WeightInputModeEnum.Price
                                ? "bg-stone-800 text-white"
                                : "text-stone-400 hover:text-stone-600"
                        }`}
                    >
                        $
                    </button>
                </div>
            </div>

            {/* +/- con display de peso o precio */}
            <div className="flex items-center gap-1">
                <button
                    onClick={onRemove}
                    className="w-9 h-9 rounded-xl bg-stone-100 active:bg-stone-200 flex items-center justify-center transition-colors shrink-0"
                    aria-label="Quitar"
                >
                    <Minus size={14} className="text-stone-600" />
                </button>

                <div className="flex-1 flex flex-col items-center">
                    <span className="text-sm font-semibold text-stone-800 tabular-nums">
                        {mode === WeightInputModeEnum.Weight ? displayWeight : displayPrice}
                    </span>
                    <span className="text-[10px] text-stone-400 leading-tight">
                        {mode === WeightInputModeEnum.Weight ? unit : `${displayWeight} ${unit}`}
                    </span>
                </div>

                <button
                    onClick={onAdd}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-opacity active:opacity-70 shrink-0"
                    style={{ backgroundColor: primaryColor }}
                    aria-label="Agregar"
                >
                    <Plus size={14} />
                </button>
            </div>
        </div>
    );
};
