import { Plus } from "lucide-react";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { WeightInputModeEnum } from "@/enums/WeightInputModeEnum";
import { UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";
import { UnitControls } from "@/components/ui/UnitControls";
import { CatalogIcon } from "@/components/ui/CatalogIcon";
import { formatCurrencyTrimmed } from "@/utils/formatCurrency";
import { isWeightUnit, weightChipOptions } from "@/utils/weightUnits";
import { getAvailableStock } from "@/utils/stock";
import { QUICK_PRICE_AMOUNTS } from "../../quickSaleConstants";
import { useProductCard } from "./useProductCard";
import { ProductCardChips } from "./ProductCardChips";
import { ProductCardMoneyEntry } from "./ProductCardMoneyEntry";
import { VariantPickerModal } from "./VariantPickerModal";

const QUICK_PRICE_OPTIONS = QUICK_PRICE_AMOUNTS.map((amount) => ({
    value: amount,
    label: formatCurrencyTrimmed(amount),
}));

interface ProductCardProps {
    product: IProduct;
    quantity: number;
    onAdd: (
        product: IProduct,
        cantidad: number,
        variant?: IProductVariant | null,
    ) => void;
    onDecrement: (product: IProduct, variant?: IProductVariant | null) => void;
    onTap: (product: IProduct) => void;
}

export const ProductCard = ({
    product,
    quantity,
    onAdd,
    onDecrement,
    onTap,
}: ProductCardProps) => {
    const {
        mode,
        setMode,
        moneyValue,
        setMoneyValue,
        maxMoneyValue,
        maxAddable,
        addWeight,
        addMoneyAmount,
        commitMoney,
        isVariantPickerOpen,
        setIsVariantPickerOpen,
        activeVariants,
        handleSelectVariant,
    } = useProductCard(product, quantity, onAdd);
    const isWeightMode = mode === WeightInputModeEnum.Weight;
    const weightUnit = isWeightUnit(product.unidad_medida)
        ? product.unidad_medida
        : null;
    const hasVariants = !weightUnit && activeVariants.length > 0;
    const isManagedStock = getAvailableStock(product) !== Infinity;
    // Sin stock disponible: ya sea porque el producto no tiene existencia, o porque el
    // carrito ya se llevó todo lo que había. maxAddable ya incluye ambos casos. Solo aplica a
    // la línea del precio base ("Paquete") — una línea de variante no descuenta stock.
    const stockExhausted = isManagedStock && maxAddable <= 0;
    // El tap directo sobre la card agrega un peso por defecto (0.5 kg o lectura de báscula) —
    // solo tiene sentido en modo "kg". En modo "$" el producto se agrega desde sus propios
    // controles (chips de monto / input), así que un toque fuera de esos controles no debe
    // agregar nada. Solo aplica cuando el producto no tiene variantes — con variantes, el tap
    // siempre abre el selector (el stock exhausto de "Paquete" se maneja dentro del modal).
    const tapToAddDisabled =
        !hasVariants &&
        (stockExhausted || (weightUnit !== null && !isWeightMode));

    const handleCardClick = () => {
        if (hasVariants) {
            setIsVariantPickerOpen(true);
            return;
        }
        if (!tapToAddDisabled) onTap(product);
    };

    return (
        <>
            <div
                role="button"
                tabIndex={0}
                aria-disabled={tapToAddDisabled}
                onClick={handleCardClick}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleCardClick();
                    }
                }}
                className={`flex flex-col gap-2.5 text-left bg-white rounded-2xl border p-4 shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                    stockExhausted && !hasVariants
                        ? "border-stone-100 cursor-not-allowed"
                        : tapToAddDisabled
                          ? "border-stone-100"
                          : "hover:shadow-md active:scale-[0.98] cursor-pointer border-stone-100 hover:border-amber-200"
                }`}
            >
                <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-10 h-10 shrink-0 rounded-xl bg-stone-100 flex items-center justify-center">
                            <CatalogIcon
                                iconName={product.icon_name}
                                iconSource={product.icon_source}
                                size={28}
                                className="text-stone-500"
                            />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-stone-900 leading-tight truncate">
                                {product.nombre}
                            </p>
                            <p
                                className="text-base font-extrabold tabular-nums leading-tight truncate"
                                style={{ color: "var(--color-primary)" }}
                            >
                                {formatCurrencyTrimmed(product.precio)}
                                {weightUnit && (
                                    <span className="text-[10px] font-semibold text-stone-400">
                                        {" "}
                                        /{UNIDAD_LABELS[weightUnit]}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    {weightUnit && (
                        <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex gap-0.5 bg-stone-100 border border-stone-200 rounded-full p-0.5 shrink-0"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setMode(WeightInputModeEnum.Weight)
                                }
                                className={`px-2 py-1 rounded-full text-[10px] font-bold transition-colors ${
                                    isWeightMode
                                        ? "text-white"
                                        : "text-stone-500"
                                }`}
                                style={
                                    isWeightMode
                                        ? {
                                              backgroundColor:
                                                  "var(--color-primary)",
                                          }
                                        : undefined
                                }
                            >
                                {UNIDAD_LABELS[weightUnit]}
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setMode(WeightInputModeEnum.Price)
                                }
                                className={`px-2 py-1 rounded-full text-[10px] font-bold transition-colors ${
                                    !isWeightMode
                                        ? "text-white"
                                        : "text-stone-500"
                                }`}
                                style={
                                    !isWeightMode
                                        ? {
                                              backgroundColor:
                                                  "var(--color-primary)",
                                          }
                                        : undefined
                                }
                            >
                                $
                            </button>
                        </div>
                    )}
                </div>

                {/* Aviso de stock en la card, no como toast — un toast tapaba los botones de
                abajo (Cobrar, imprimir, etc.) sobre todo al tocar "+" repetido. */}
                {stockExhausted && !hasVariants && (
                    <p className="text-[11px] font-bold text-red-600 uppercase tracking-wide">
                        {quantity > 0
                            ? "Ya agregaste todo el stock disponible"
                            : "Sin stock"}
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
                        <div className="flex flex-col gap-1.5">
                            <ProductCardChips
                                options={QUICK_PRICE_OPTIONS}
                                onAdd={addMoneyAmount}
                                disabled={stockExhausted}
                                maxAddable={
                                    Number.isFinite(maxMoneyValue)
                                        ? maxMoneyValue
                                        : undefined
                                }
                            />
                            <ProductCardMoneyEntry
                                value={moneyValue}
                                onChange={setMoneyValue}
                                onCommit={commitMoney}
                                maxValue={maxMoneyValue}
                                disabled={stockExhausted}
                            />
                        </div>
                    )
                ) : hasVariants ? (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsVariantPickerOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-lg text-white active:scale-95 transition-all"
                        style={{ backgroundColor: "var(--color-primary)" }}
                    >
                        <Plus size={14} />
                        Agregar
                    </button>
                ) : quantity === 0 ? (
                    <button
                        type="button"
                        disabled={stockExhausted}
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdd(product, 1);
                        }}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-lg text-white active:scale-95 transition-all disabled:bg-stone-300 disabled:cursor-not-allowed disabled:active:scale-100"
                        style={
                            stockExhausted
                                ? undefined
                                : { backgroundColor: "var(--color-primary)" }
                        }
                    >
                        <Plus size={14} />
                        Agregar
                    </button>
                ) : (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex justify-center"
                    >
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

            {hasVariants && (
                <VariantPickerModal
                    isOpen={isVariantPickerOpen}
                    product={product}
                    activeVariants={activeVariants}
                    packageDisabled={stockExhausted}
                    onSelect={handleSelectVariant}
                    onClose={() => setIsVariantPickerOpen(false)}
                />
            )}
        </>
    );
};
