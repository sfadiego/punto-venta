import { X } from "lucide-react";
import { FormikProps } from "formik";
import { IProduct } from "@/models/IProduct";
import { IProductVariant } from "@/models/IProductVariant";
import { Input } from "@/components/ui/form/Input";
import { Textarea } from "@/components/ui/form/textarea";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { RestockForm } from "./useRestockModal";
import { SelectRestockVariant } from "./SelectRestockVariant";

interface RestockModalProps {
    isOpen: boolean;
    product: IProduct | null;
    hasVariants: boolean;
    activeVariants: IProductVariant[];
    variantId: string;
    setVariantId: (value: string) => void;
    selectedVariant: IProductVariant | null;
    formik: FormikProps<RestockForm>;
    onClose: () => void;
}

export const RestockModal = ({
    isOpen,
    product,
    hasVariants,
    activeVariants,
    variantId,
    setVariantId,
    selectedVariant,
    formik,
    onClose,
}: RestockModalProps) => {
    if (!isOpen || !product) return null;

    // Con variantes, el stock vive en cada una — no hay ajuste "agregado" del producto, hay
    // que elegir cuál variante se está reabasteciendo antes de mostrar su stock/mínimo.
    const currentStock = hasVariants ? selectedVariant?.stock : product.stock;
    const currentMinStock = hasVariants ? selectedVariant?.min_stock : product.min_stock;
    const canSubmit = !hasVariants || !!selectedVariant;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                    <div>
                        <h2 className="text-base font-semibold text-stone-900">Reabastecer stock</h2>
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

                <form onSubmit={formik.handleSubmit} className="p-5 space-y-4">
                    {hasVariants && (
                        <SelectRestockVariant variants={activeVariants} value={variantId} onChange={setVariantId} />
                    )}

                    {(!hasVariants || selectedVariant) && (
                        <div className="px-3 py-2.5 rounded-xl bg-stone-50 border border-stone-200 text-sm text-stone-600">
                            Stock actual: <span className="font-semibold text-stone-900">{trimDecimalZeros(currentStock ?? 0)}</span>
                            {" · "}
                            Mínimo: <span className="font-semibold text-stone-900">{trimDecimalZeros(currentMinStock ?? 0)}</span>
                        </div>
                    )}

                    <Input<RestockForm>
                        name="delta"
                        label="Cantidad a agregar *"
                        inputType="number"
                        min={0}
                        step={1}
                        placeholder="0"
                        formik={formik}
                        disabled={!canSubmit}
                    />

                    <Textarea<RestockForm>
                        name="note"
                        label="Nota (opcional)"
                        placeholder="Ej: compra a proveedor"
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
                            {formik.isSubmitting ? "Guardando..." : "Reabastecer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
