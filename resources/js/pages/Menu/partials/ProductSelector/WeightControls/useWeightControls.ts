import { useState, useEffect } from "react";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { WeightUnit, weightMin, weightMax, formatWeight } from "@/utils/weightUnits";
import { calcWeightFromPrice } from "@/utils/calcWeightFromPrice";

interface UseWeightControlsParams {
    cantidad: number;
    unit: WeightUnit;
    precio: number;
    onChangeWeight: (weight: number) => void;
}

const formatWeightInput = (cantidad: number, unit: WeightUnit): string =>
    unit === UnidadMedidaEnum.Kg
        ? cantidad.toFixed(1)
        : String(Math.round(cantidad));

export const useWeightControls = ({ cantidad, unit, precio, onChangeWeight }: UseWeightControlsParams) => {
    const [mode, setModeState] = useState<WeightInputModeEnum>(WeightInputModeEnum.Weight);
    const [weightInput, setWeightInput] = useState(
        cantidad > 0 ? formatWeightInput(cantidad, unit) : ""
    );
    const [priceInput, setPriceInput] = useState(
        cantidad > 0 ? String(Math.round(cantidad * Number(precio))) : ""
    );
    const [error, setError] = useState("");

    useEffect(() => {
        if (cantidad > 0) {
            setWeightInput(formatWeightInput(cantidad, unit));
            setPriceInput(String(Math.round(cantidad * Number(precio))));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cantidad]);

    const setMode = (next: WeightInputModeEnum) => {
        setModeState(next);
        setError("");
    };

    const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const allowed = unit === UnidadMedidaEnum.Kg ? /[^0-9.]/g : /[^0-9]/g;
        const cleaned = e.target.value.replace(allowed, "");
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed > weightMax(unit)) {
            setWeightInput(String(weightMax(unit)));
            setError(`Máximo ${formatWeight(weightMax(unit), unit)}`);
            return;
        }
        setWeightInput(cleaned);
        setError("");
    };

    const applyWeight = () => {
        const weight = parseFloat(weightInput);
        if (isNaN(weight) || weight <= 0) return;
        if (weight > weightMax(unit)) {
            setError(`Máximo ${formatWeight(weightMax(unit), unit)}`);
            return;
        }
        if (weight >= weightMin(unit)) {
            onChangeWeight(weight);
        }
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/[^0-9]/g, "");
        if (digits === "") { setPriceInput(""); setError(""); return; }
        const num = parseInt(digits, 10);
        const maxPrice = Math.ceil(weightMax(unit) * Number(precio));
        if (num > maxPrice) {
            setPriceInput(String(maxPrice));
            setError(`Máximo $${maxPrice.toLocaleString()}`);
            return;
        }
        setPriceInput(String(num));
        setError("");
    };

    const applyPrice = () => {
        const num = parseInt(priceInput, 10);
        if (isNaN(num) || num <= 0) return;
        const weight = calcWeightFromPrice(num, Number(precio));
        if (weight > weightMax(unit)) {
            setError(`Máximo ${formatWeight(weightMax(unit), unit)}`);
            return;
        }
        if (weight >= weightMin(unit)) {
            onChangeWeight(weight);
        }
    };

    const parsedPrice = parseInt(priceInput) || 0;
    const weightEquivalent = parsedPrice > 0
        ? formatWeight(calcWeightFromPrice(parsedPrice, Number(precio)), unit)
        : "";

    return {
        mode, setMode,
        weightInput, handleWeightChange, applyWeight,
        priceInput, handlePriceChange, applyPrice,
        weightEquivalent, error,
    };
};
