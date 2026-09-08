import { X } from "lucide-react";
import { FormikProps } from "formik";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { MAX_STOCK_ADJUSTMENT } from "@/utils/stockLimits";
import { StockAdjustmentForm } from "./useStockAdjustmentModal";
import { ProductAutocomplete } from "../ProductAutocomplete";
import { SelectAdjustmentVariant } from "./SelectAdjustmentVariant";

interface StockAdjustmentModalProps {
    isOpen: boolean;
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
    onClose: () => void;
}

export const StockAdjustmentModal = ({
    isOpen,
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
    onClose,
}: StockAdjustmentModalProps) => {
    if (!isOpen) return null;

    const currentStock = hasVariants ? selectedVariant?.stock : product?.stock;
    const currentMinStock = hasVariants ? selectedVariant?.min_stock : product?.min_stock;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                    <h2 className="text-base font-semibold text-stone-900">Reajuste de stock</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="p-5 space-y-4">
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
                        // step debe alinear con min en la misma precisión decimal (2 dígitos,
                        // igual que la columna stock) — con step=1 y un min fraccionario
                        // (-999999.99) el navegador rechaza valores enteros válidos como 993
                        // con su propio popup nativo ("valor no permitido"), en vez de dejar
                        // que la validación de Yup lo maneje como el resto de los inputs.
                        step={0.01}
                        min={-MAX_STOCK_ADJUSTMENT}
                        max={MAX_STOCK_ADJUSTMENT}
                        placeholder="0"
                        formik={formik}
                        disabled={!canSubmit}
                    />

                    <Textarea<StockAdjustmentForm>
                        name="note"
                        label="Nota (opcional)"
                        placeholder="Ej: conteo físico, reajuste por obsolescencia"
                        formik={formik}
                        rows={2}
                    />

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={formik.isSubmitting || !canSubmit}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {formik.isSubmitting ? "Guardando..." : "Ajustar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
