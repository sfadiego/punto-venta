import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { WeightUnit } from "@/utils/weightUnits";
import { Input } from "@/components/ui/form/Input";
import { WeightModeToggle } from "@/components/ui/WeightModeToggle";
import { useWeightControls } from "./useWeightControls";

interface WeightControlsProps {
    cantidad: number;
    unit: WeightUnit;
    precio: number;
    primaryColor: string;
    onChangeWeight: (weight: number) => void;
}

export const WeightControls = ({
    cantidad,
    unit,
    precio,
    primaryColor,
    onChangeWeight,
}: WeightControlsProps) => {
    const {
        mode, setMode,
        weightInput, handleWeightChange, applyWeight,
        priceInput, handlePriceChange, applyPrice,
        weightEquivalent, error,
    } = useWeightControls({ cantidad, unit, precio, onChangeWeight });

    return (
        <div className="flex flex-col gap-1.5">
            {/* Toggle kg / $ */}
            <div className="flex justify-end">
                <WeightModeToggle
                    mode={mode}
                    weightLabel={unit}
                    onSelectWeight={() => setMode(WeightInputModeEnum.Weight)}
                    onSelectPrice={() => setMode(WeightInputModeEnum.Price)}
                />
            </div>

            {error && (
                <p className="text-red-500 text-xs text-right">{error}</p>
            )}

            {mode === WeightInputModeEnum.Weight ? (
                /* Modo peso: input directo de kg/gr + Aplicar */
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <Input
                                name="weight"
                                inputType="text"
                                value={weightInput}
                                onChange={handleWeightChange}
                                onKeyDown={(e) => e.key === "Enter" && applyWeight()}
                                placeholder={unit === UnidadMedidaEnum.Kg ? "Ingresa kg" : "Ingresa gr"}
                                className="text-center tabular-nums"
                            />
                        </div>
                        <span className="text-xs font-semibold text-stone-500 tabular-nums shrink-0">
                            {unit}
                        </span>
                    </div>
                    <button
                        onClick={applyWeight}
                        className="w-full py-1.5 rounded-xl text-white text-xs font-semibold transition-opacity active:opacity-70"
                        style={{ backgroundColor: primaryColor }}
                    >
                        Aplicar
                    </button>
                </div>
            ) : (
                /* Modo precio: input + equivalente en peso + Aplicar */
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <Input
                                name="price"
                                inputType="text"
                                value={priceInput}
                                onChange={handlePriceChange}
                                onKeyDown={(e) => e.key === "Enter" && applyPrice()}
                                placeholder="Ingresa monto $"
                                className="text-center tabular-nums"
                            />
                        </div>
                        {weightEquivalent && (
                            <span className="text-xs font-semibold text-stone-500 tabular-nums shrink-0">
                                {weightEquivalent}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={applyPrice}
                        className="w-full py-1.5 rounded-xl text-white text-xs font-semibold transition-opacity active:opacity-70"
                        style={{ backgroundColor: primaryColor }}
                    >
                        Aplicar
                    </button>
                </div>
            )}
        </div>
    );
};
