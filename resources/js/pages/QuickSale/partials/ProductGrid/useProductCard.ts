import { useState } from "react";
import { toast } from "react-toastify";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";
import { calcWeightFromPrice } from "@/utils/calcWeightFromPrice";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { getAvailableStock } from "@/utils/stock";
import { MAX_CANTIDAD_KG } from "../../quickSaleConstants";
import { useVariantPicker } from "./useVariantPicker";

export const useProductCard = (
    product: IProduct,
    quantity: number,
    onAdd: (product: IProduct, cantidad: number, variant?: IProductVariant | null) => void,
) => {
    const [mode, setMode] = useState<WeightInputModeEnum>(WeightInputModeEnum.Weight);
    const [moneyValue, setMoneyValue] = useState("");
    const variantPicker = useVariantPicker(product, onAdd);

    // Cuánto más se puede agregar de este producto: el menor entre MAX_CANTIDAD_KG y lo que
    // queda de stock (existencia total menos lo que ya está en el carrito). Sin manage_stock,
    // getAvailableStock devuelve Infinity y el tope queda solo en MAX_CANTIDAD_KG, como antes.
    const remainingStock = getAvailableStock(product) - quantity;
    const maxAddable = Math.max(0, Math.min(MAX_CANTIDAD_KG, remainingStock));

    // Monto máximo que este producto acepta en el modo $ antes de superar maxAddable al
    // convertirse a su unidad — evita montos sin relación real con el producto o que superen
    // el stock disponible.
    const maxMoneyValue = product.precio > 0 ? maxAddable * product.precio : Infinity;

    const addWeight = (cantidad: number) => onAdd(product, cantidad);

    // Agrega por monto en $, ya sea desde el input manual (commitMoney) o desde un botón de
    // monto rápido (QUICK_PRICE_AMOUNTS). Devuelve si el monto se pudo agregar, para que
    // commitMoney solo limpie el input en caso de éxito.
    const addMoneyAmount = (pesos: number): boolean => {
        if (!pesos || pesos <= 0) return false;
        if (pesos > maxMoneyValue) {
            const unitLabel = UNIDAD_LABELS[product.unidad_medida] ?? "kg";
            toast.error(
                `El monto máximo para este producto es ${formatCurrencyTrimmed(maxMoneyValue)} (${maxAddable} ${unitLabel}).`,
            );
            return false;
        }
        const cantidad = calcWeightFromPrice(pesos, product.precio);
        if (cantidad <= 0) return false;
        onAdd(product, cantidad);
        return true;
    };

    const commitMoney = () => {
        if (addMoneyAmount(parseFloat(moneyValue))) setMoneyValue("");
    };

    return {
        mode,
        setMode,
        moneyValue,
        setMoneyValue,
        maxMoneyValue,
        maxAddable,
        addWeight,
        addMoneyAmount,
        commitMoney,
        ...variantPicker,
    };
};
