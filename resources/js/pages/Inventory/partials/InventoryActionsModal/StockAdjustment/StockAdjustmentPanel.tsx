import { FormikProps } from "formik";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { MAX_STOCK_ADJUSTMENT } from "@/utils/stockLimits";
import { StockAdjustmentForm } from "./useStockAdjustmentPanel";
import { ProductAutocomplete } from "../../ProductAutocomplete";
import { SelectAdjustmentVariant } from "./SelectAdjustmentVariant";

interface StockAdjustmentPanelProps {
    query: string;
    handleQueryChange: (value: string) => void;
    suggestions: IProduct[];
    isDropdownOpen: boolean;
    setIsDropdownOpen: (open: boolean) => void;
    product: IProduct | null;
    selectProduct: (product: IProduct) => void;
    hasVariants: boolean;
    activeVariants: IProductVariant[];
    variantId: string;
    setVariantId: (value: string) => void;
    selectedVariant: IProductVariant | null;
    canSubmit: boolean;
    formik: FormikProps<StockAdjustmentForm>;
}

export const StockAdjustmentPanel = ({
    query,
    handleQueryChange,
    suggestions,
    isDropdownOpen,
    setIsDropdownOpen,
    product,
    selectProduct,
    hasVariants,
    activeVariants,
    variantId,
    setVariantId,
    selectedVariant,
    canSubmit,
    formik,
}: StockAdjustmentPanelProps) => {
    const currentStock = hasVariants ? selectedVariant?.stock : product?.stock;
    const currentMinStock = hasVariants ? selectedVariant?.min_stock : product?.min_stock;

    // Formik parsea automáticamente a number los inputs con type="number" (su handleChange
    // interno hace parseFloat) — formik.values.delta puede llegar como number en runtime pese
    // a que StockAdjustmentForm lo declara string, así que se castea con String() antes de
    // cualquier operación de string para no depender del tipo declarado.
    const rawDelta = String(formik.values.delta ?? "");
    const delta = Number(rawDelta);
    const hasDeltaValue = rawDelta.trim() !== "" && Number.isFinite(delta);
    const newStock = hasDeltaValue ? Number(currentStock ?? 0) + delta : null;
    // Espeja las reglas del schema de Yup (typeError, notOneOf 0, min/max) para deshabilitar
    // "Ajustar" antes de enviar, en vez de solo mostrar el error tras el intento de submit.
    const isDeltaValid =
        hasDeltaValue && delta !== 0 && delta >= -MAX_STOCK_ADJUSTMENT && delta <= MAX_STOCK_ADJUSTMENT;

    return (
        <form onSubmit={formik.handleSubmit} className="space-y-4">
            <ProductAutocomplete
                value={query}
                onChange={handleQueryChange}
                suggestions={suggestions}
                isOpen={isDropdownOpen}
                setIsOpen={setIsDropdownOpen}
                onSelect={selectProduct}
                inline
            />

            {hasVariants && (
                <SelectAdjustmentVariant variants={activeVariants} value={variantId} onChange={setVariantId} />
            )}

            {product && (!hasVariants || selectedVariant) && (
                <div className="px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-600">
                    Stock actual: <span className="font-semibold text-stone-900">{trimDecimalZeros(currentStock ?? 0)}</span>
                    {" · "}
                    Mínimo: <span className="font-semibold text-stone-900">{trimDecimalZeros(currentMinStock ?? 0)}</span>
                </div>
            )}

            <Input<StockAdjustmentForm>
                name="delta"
                label="Cantidad (+ entrada, - reajuste) *"
                inputType="number"
                // step debe alinear con min en la misma precisión decimal (2 dígitos, igual
                // que la columna stock) — con step=1 y un min fraccionario (-999999.99) el
                // navegador rechaza valores enteros válidos con su propio popup nativo, en
                // vez de dejar que la validación de Yup lo maneje como el resto de los inputs.
                step={0.01}
                min={-MAX_STOCK_ADJUSTMENT}
                max={MAX_STOCK_ADJUSTMENT}
                placeholder="0"
                formik={formik}
                disabled={!canSubmit}
            />

            {newStock !== null && (
                <p className="text-xs text-stone-400 -mt-4">
                    Nuevo valor de stock: {trimDecimalZeros(newStock)}
                </p>
            )}

            <Textarea<StockAdjustmentForm>
                name="note"
                label="Nota (opcional)"
                placeholder="Ej: conteo físico, reajuste por obsolescencia"
                formik={formik}
                rows={2}
            />

            <button
                type="submit"
                disabled={formik.isSubmitting || !canSubmit || !isDeltaValid}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {formik.isSubmitting ? "Guardando..." : "Ajustar"}
            </button>
        </form>
    );
};
