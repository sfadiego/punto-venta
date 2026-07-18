import { useState, useEffect } from "react";
import { UnidadMedidaEnum } from "@/enums/UnidadMedidaEnum";
import { WeightUnit, weightMin, formatWeight } from "@/utils/weightUnits";
import { calcWeightFromPrice } from "@/utils/calcWeightFromPrice";

interface CartWeightInputProps {
    cantidad: number;
    unit: WeightUnit;
    precio: number;
    productId: number;
    onSetWeight: (productId: number, weight: number) => void;
}

export const CartWeightInput = ({
    cantidad,
    unit,
    precio,
    productId,
    onSetWeight,
}: CartWeightInputProps) => {
    const [priceInput, setPriceInput] = useState(String(Math.round(cantidad * precio)));

    // Sincroniza cuando +/- del carrito cambian la cantidad externamente
    useEffect(() => {
        setPriceInput(String(Math.round(cantidad * precio)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cantidad]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/[^0-9]/g, "");
        const num = parseInt(digits, 10);
        setPriceInput(!digits || isNaN(num) ? "0" : String(num));
    };

    const apply = () => {
        const num = parseInt(priceInput, 10);
        if (isNaN(num) || num <= 0) {
            setPriceInput(String(Math.round(cantidad * precio)));
            return;
        }
        const weight = calcWeightFromPrice(num, precio);
        if (weight >= weightMin(unit)) {
            onSetWeight(productId, weight);
        } else {
            setPriceInput(String(Math.round(cantidad * precio)));
        }
    };

    const weightEquivalent = formatWeight(
        calcWeightFromPrice(parseInt(priceInput) || 0, precio),
        unit
    );

    const currentWeight =
        unit === UnidadMedidaEnum.Kg
            ? `${cantidad.toFixed(1)} ${unit}`
            : `${Math.round(cantidad)} ${unit}`;

    return (
        <div className="flex flex-col items-center gap-0.5 min-w-0">
            {/* Input de precio — campo primario */}
            <div className="flex items-center gap-0.5">
                <span className="text-[11px] text-stone-400 font-medium leading-none">$</span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={priceInput}
                    onChange={handleChange}
                    onBlur={apply}
                    onKeyDown={(e) => e.key === "Enter" && apply()}
                    className="w-14 text-center text-sm font-semibold text-stone-800 bg-transparent border-0 outline-none tabular-nums"
                    aria-label="Precio en pesos"
                />
            </div>
            {/* Equivalente en peso — muestra lo que se aplicó y lo que se va a aplicar */}
            <span className="text-[10px] text-stone-400 tabular-nums leading-none">
                {priceInput === String(Math.round(cantidad * precio))
                    ? currentWeight
                    : weightEquivalent}
            </span>
        </div>
    );
};
