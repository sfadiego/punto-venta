import { useState } from "react";
import { toast } from "react-toastify";
import { IProduct } from "@/models/IProduct";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { calcWeightFromPrice } from "@/utils/calcWeightFromPrice";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { MAX_CANTIDAD_KG } from "../../quickSaleConstants";

export const useProductCard = (
    product: IProduct,
    onAdd: (product: IProduct, cantidadKg: number) => void,
) => {
    const [mode, setMode] = useState<WeightInputModeEnum>(WeightInputModeEnum.Weight);
    const [moneyValue, setMoneyValue] = useState("");

    // Monto máximo que este producto acepta en el modo $ antes de superar MAX_CANTIDAD_KG
    // al convertirse a kilos — evita montos sin relación real con el producto (ej. "534534").
    const maxMoneyValue = product.precio > 0 ? MAX_CANTIDAD_KG * product.precio : Infinity;

    const addWeight = (kg: number) => onAdd(product, kg);

    const commitMoney = () => {
        const pesos = parseFloat(moneyValue);
        if (!pesos || pesos <= 0) return;
        if (pesos > maxMoneyValue) {
            toast.error(
                `El monto máximo para este producto es ${formatCurrencyTrimmed(maxMoneyValue)} (${MAX_CANTIDAD_KG} kg).`,
            );
            return;
        }
        const kg = calcWeightFromPrice(pesos, product.precio);
        if (kg <= 0) return;
        onAdd(product, kg);
        setMoneyValue("");
    };

    return { mode, setMode, moneyValue, setMoneyValue, maxMoneyValue, addWeight, commitMoney };
};
