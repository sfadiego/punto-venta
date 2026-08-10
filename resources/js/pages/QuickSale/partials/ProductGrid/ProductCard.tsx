import { Plus } from "lucide-react";
import { IProduct } from "@/models/IProduct";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";
import { UnitControls } from "@/components/ui/UnitControls";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { isWeightUnit, weightChipOptions } from "@/utils/weightUnits";
import { getAvailableStock } from "@/utils/stock";
import { useProductCard } from "./useProductCard";
import { ProductCardChips } from "./ProductCardChips";
import { ProductCardMoneyEntry } from "./ProductCardMoneyEntry";

interface ProductCardProps {
    product: IProduct;
    quantity: number;
    onAdd: (product: IProduct, cantidad: number) => void;
    onDecrement: (product: IProduct) => void;
    onTap: (product: IProduct) => void;
    hasStagedWeight?: boolean;
}

export const ProductCard = ({ product, quantity, onAdd, onDecrement, onTap, hasStagedWeight = false }: ProductCardProps) => {
    const { mode, setMode, moneyValue, setMoneyValue, maxMoneyValue, maxAddable, addWeight, commitMoney } = useProductCard(
        product,
        quantity,
        onAdd,
    );
    const isWeightMode = mode === WeightInputModeEnum.Weight;
    const weightUnit = isWeightUnit(product.unidad_medida) ? product.unidad_medida : null;
    const isManagedStock = getAvailableStock(product) !== Infinity;
    // Sin stock disponible: ya sea porque el producto no tiene existencia, o porque el
    // carrito ya se llevó todo lo que había. maxAddable ya incluye ambos casos.
    const stockExhausted = isManagedStock && maxAddable <= 0;

    return (
        <div
            role="button"
            tabIndex={0}
            aria-disabled={stockExhausted}
            onClick={() => {
                if (!stockExhausted) onTap(product);
            }}
            onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !stockExhausted) {
                    e.preventDefault();
                    onTap(product);
                }
            }}
            className={`flex flex-col gap-2.5 text-left bg-white rounded-2xl border p-4 shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                stockExhausted
                    ? "border-stone-100 cursor-not-allowed"
                    : `hover:shadow-md active:scale-[0.98] cursor-pointer ${
                          hasStagedWeight ? "border-amber-300 ring-1 ring-amber-200" : "border-stone-100 hover:border-amber-200"
                      }`
            }`}
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-stone-900 leading-tight">{product.nombre}</p>
                {weightUnit && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex gap-0.5 bg-stone-100 border border-stone-200 rounded-full p-0.5 shrink-0"
                    >
                        <button
                            type="button"
                            onClick={() => setMode(WeightInputModeEnum.Weight)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                                isWeightMode ? "text-white" : "text-stone-500"
                            }`}
                            style={isWeightMode ? { backgroundColor: "var(--color-primary)" } : undefined}
                        >
                            {UNIDAD_LABELS[weightUnit]}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode(WeightInputModeEnum.Price)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                                !isWeightMode ? "text-white" : "text-stone-500"
                            }`}
                            style={!isWeightMode ? { backgroundColor: "var(--color-primary)" } : undefined}
                        >
                            $
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between gap-2">
                <p className="text-xl font-extrabold tabular-nums" style={{ color: "var(--color-primary)" }}>
                    {formatCurrencyTrimmed(product.precio)}
                    {weightUnit && <span className="text-xs font-semibold text-stone-400"> / {UNIDAD_LABELS[weightUnit]}</span>}
                </p>
            </div>

            {/* Aviso de stock en la card, no como toast — un toast tapaba los botones de
                abajo (Cobrar, imprimir, etc.) sobre todo al tocar "+" repetido. */}
            {stockExhausted && (
                <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide -mt-1.5">
                    {quantity > 0 ? "Ya agregaste todo el stock disponible" : "Sin stock"}
                </p>
            )}

            {weightUnit ? (
                isWeightMode ? (
                    <ProductCardChips
                        options={weightChipOptions(weightUnit)}
                        onAdd={addWeight}
                        disabled={stockExhausted}
                        maxAddable={isManagedStock ? maxAddable : undefined}
                    />
                ) : (
                    <ProductCardMoneyEntry
                        value={moneyValue}
                        onChange={setMoneyValue}
                        onCommit={commitMoney}
                        maxValue={maxMoneyValue}
                        disabled={stockExhausted}
                    />
                )
            ) : quantity === 0 ? (
                <button
                    type="button"
                    disabled={stockExhausted}
                    onClick={(e) => {
                        e.stopPropagation();
                        onAdd(product, 1);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-lg text-white active:scale-95 transition-all disabled:bg-stone-300 disabled:cursor-not-allowed disabled:active:scale-100"
                    style={stockExhausted ? undefined : { backgroundColor: "var(--color-primary)" }}
                >
                    <Plus size={14} />
                    Agregar
                </button>
            ) : (
                <div onClick={(e) => e.stopPropagation()} className="flex justify-center">
                    <UnitControls
                        quantity={quantity}
                        primaryColor="var(--color-primary)"
                        onAdd={() => onAdd(product, 1)}
                        onRemove={() => onDecrement(product)}
                        disableAdd={stockExhausted}
                    />
                </div>
            )}
        </div>
    );
};
