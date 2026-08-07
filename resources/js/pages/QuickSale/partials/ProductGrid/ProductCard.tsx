import { IProduct } from "@/models/IProduct";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { useProductCard } from "./useProductCard";
import { ProductCardChips } from "./ProductCardChips";
import { ProductCardMoneyEntry } from "./ProductCardMoneyEntry";

interface ProductCardProps {
    product: IProduct;
    onAdd: (product: IProduct, cantidadKg: number) => void;
    onTap: (product: IProduct) => void;
    hasStagedWeight?: boolean;
}

export const ProductCard = ({ product, onAdd, onTap, hasStagedWeight = false }: ProductCardProps) => {
    const { mode, setMode, moneyValue, setMoneyValue, maxMoneyValue, addWeight, commitMoney } = useProductCard(product, onAdd);
    const isWeightMode = mode === WeightInputModeEnum.Weight;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onTap(product)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onTap(product);
                }
            }}
            className={`flex flex-col gap-2.5 text-left bg-white rounded-2xl border p-4 shadow-sm hover:shadow-md active:scale-[0.98] transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                hasStagedWeight ? "border-amber-300 ring-1 ring-amber-200" : "border-stone-100 hover:border-amber-200"
            }`}
        >
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-stone-900 leading-tight">{product.nombre}</p>
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex gap-0.5 bg-stone-100 border border-stone-200 rounded-full p-0.5 shrink-0"
                >
                    <button
                        type="button"
                        onClick={() => setMode(WeightInputModeEnum.Weight)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                            isWeightMode ? "bg-amber-500 text-white" : "text-stone-500"
                        }`}
                    >
                        kg
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode(WeightInputModeEnum.Price)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors ${
                            !isWeightMode ? "bg-amber-500 text-white" : "text-stone-500"
                        }`}
                    >
                        $
                    </button>
                </div>
            </div>

            <p className="text-xl font-extrabold text-amber-600 tabular-nums">
                {formatCurrencyTrimmed(product.precio)} <span className="text-xs font-semibold text-stone-400">/ kg</span>
            </p>

            {isWeightMode ? (
                <ProductCardChips onAdd={addWeight} />
            ) : (
                <ProductCardMoneyEntry
                    value={moneyValue}
                    onChange={setMoneyValue}
                    onCommit={commitMoney}
                    maxValue={maxMoneyValue}
                />
            )}
        </div>
    );
};
