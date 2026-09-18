import { X } from "lucide-react";
import { FormikProps } from "formik";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { MAX_STOCK_ADJUSTMENT } from "@/utils/stockLimits";
import { SelectProductVariant } from "@/components/SelectProductVariant";
import { StockAdjustForm, StockAdjustMode } from "./useStockAdjustModal";

interface StockAdjustModalProps {
    mode: StockAdjustMode;
    isOpen: boolean;
    product: IProduct | null;
    hasVariants: boolean;
    activeVariants: IProductVariant[];
    variantId: string;
    setVariantId: (value: string) => void;
    selectedVariant: IProductVariant | null;
    currentStock: number | null;
    currentMinStock: number | null;
    formik: FormikProps<StockAdjustForm>;
    onClose: () => void;
}

export const StockAdjustModal = ({
    mode,
    isOpen,
    product,
    hasVariants,
    activeVariants,
    variantId,
    setVariantId,
    selectedVariant,
    currentStock,
    currentMinStock,
    formik,
    onClose,
}: StockAdjustModalProps) => {
    if (!isOpen || !product) return null;

    const canSubmit = !hasVariants || !!selectedVariant;
    const isRestock = mode === "restock";

    // Reajuste (no reabastecer, que ya solo acepta delta > 0): si el delta tecleado dejaría el
    // stock en negativo, deshabilita "Ajustar" en vivo en vez de esperar a que el usuario
    // mande el formulario y reciba el 422 del backend.
    const deltaValue = Number(formik.values.delta);
    const wouldResultNegative =
        !isRestock && currentStock !== null && !Number.isNaN(deltaValue) && currentStock + deltaValue < 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                    <div>
                        <h2 className="text-base font-semibold text-stone-900">
                            {isRestock ? "Reabastecer stock" : "Reajuste de stock"}
                        </h2>
                        <p className="text-xs text-stone-400">{product.nombre}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="text-stone-400 hover:text-stone-600 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} noValidate className="p-5 space-y-4">
                    {hasVariants && (
                        <SelectProductVariant variants={activeVariants} value={variantId} onChange={setVariantId} />
                    )}

                    {(!hasVariants || selectedVariant) && (
                        <div className="px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-600">
                            Stock actual: <span className="font-semibold text-stone-900">{trimDecimalZeros(currentStock ?? 0)}</span>
                            {" · "}
                            Mínimo: <span className="font-semibold text-stone-900">{trimDecimalZeros(currentMinStock ?? 0)}</span>
                        </div>
                    )}

                    <Input<StockAdjustForm>
                        name="delta"
                        label={isRestock ? "Cantidad a agregar *" : "Cantidad (+ entrada, - reajuste) *"}
                        inputType="number"
                        min={isRestock ? 0 : -MAX_STOCK_ADJUSTMENT}
                        max={MAX_STOCK_ADJUSTMENT}
                        step={1}
                        placeholder="0"
                        formik={formik}
                        disabled={!canSubmit}
                    />

                    <Textarea<StockAdjustForm>
                        name="note"
                        label="Nota (opcional)"
                        placeholder={isRestock ? "Ej: compra a proveedor" : "Ej: conteo físico, merma"}
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
                            disabled={formik.isSubmitting || !canSubmit || wouldResultNegative}
                            title={wouldResultNegative ? "El stock disponible no alcanza para este reajuste" : undefined}
                            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {formik.isSubmitting ? "Guardando..." : isRestock ? "Reabastecer" : "Ajustar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
