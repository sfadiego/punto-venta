import { FormikProps } from "formik";
import { Plus, Trash2, X } from "lucide-react";
import { ProductForm } from "./useProductModal";
import { useProductVariantsField } from "./useProductVariantsField";
import { Input } from "@/components/ui/form/Input";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { IProductVariant } from "@/models/IProductVariant";

interface ProductVariantsModalProps {
    isOpen: boolean;
    formik: FormikProps<ProductForm>;
    manageStock: boolean;
    productVariants: IProductVariant[];
    onClose: () => void;
}

export const ProductVariantsModal = ({ isOpen, formik, manageStock, productVariants, onClose }: ProductVariantsModalProps) => {
    const { variants, updateVariant, addVariant, removeVariant, touchVariantField, getVariantError } =
        useProductVariantsField(formik);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
                    <div>
                        <h2 className="text-base font-semibold text-stone-900">Variantes</h2>
                        <p className="text-xs text-stone-400 mt-0.5">
                            El precio base solo aplica si el producto no tiene variantes activas.
                            {manageStock && " Cada variante lleva su propia existencia."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="text-stone-400 hover:text-stone-600 transition-colors shrink-0 ml-3"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5 space-y-2 overflow-y-auto">
                    {variants.map((variant, index) => (
                        <div key={index} className="flex flex-wrap items-end gap-2 p-3 rounded-xl border border-stone-100">
                            <div className="flex-1 min-w-[160px]">
                                <Input
                                    name={`variant-nombre-${index}`}
                                    label="Nombre"
                                    placeholder="Ej: Chica, Talla 26..."
                                    value={variant.nombre}
                                    onChange={(e) => updateVariant(index, { nombre: e.target.value })}
                                    onBlur={() => touchVariantField(index, "nombre")}
                                    error={getVariantError(index, "nombre")}
                                />
                            </div>
                            <div className="w-28">
                                <Input
                                    name={`variant-precio-${index}`}
                                    label="Precio"
                                    inputType="number"
                                    min={0}
                                    step={0.5}
                                    placeholder="0.00"
                                    value={variant.precio}
                                    onChange={(e) => updateVariant(index, { precio: e.target.value })}
                                    onBlur={() => touchVariantField(index, "precio")}
                                    error={getVariantError(index, "precio")}
                                    icon="$"
                                    className="tabular-nums"
                                />
                            </div>

                            {manageStock && (
                                <>
                                    <div className="w-24">
                                        {variant.id ? (
                                            <>
                                                <label className="block text-sm font-medium text-stone-700 mb-1.5">Stock</label>
                                                <div className="px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-600 tabular-nums">
                                                    {/* variant.stock (form) siempre viene vacío al editar — la
                                                        existencia real se lee del producto cargado, no del form. */}
                                                    {trimDecimalZeros(
                                                        productVariants.find((pv) => pv.id === variant.id)?.stock ?? 0,
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <Input
                                                name={`variant-stock-${index}`}
                                                label="Stock"
                                                inputType="number"
                                                min={0}
                                                step={1}
                                                placeholder="0"
                                                value={variant.stock}
                                                onChange={(e) => updateVariant(index, { stock: e.target.value })}
                                                onBlur={() => touchVariantField(index, "stock")}
                                                error={getVariantError(index, "stock")}
                                            />
                                        )}
                                    </div>
                                    <div className="w-24">
                                        <Input
                                            name={`variant-min-stock-${index}`}
                                            label="Mín."
                                            inputType="number"
                                            min={0}
                                            step={1}
                                            placeholder="2"
                                            value={variant.min_stock}
                                            onChange={(e) => updateVariant(index, { min_stock: e.target.value })}
                                            onBlur={() => touchVariantField(index, "min_stock")}
                                            error={getVariantError(index, "min_stock")}
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="button"
                                onClick={() => removeVariant(index)}
                                className="p-2.5 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={addVariant}
                        className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 py-1"
                    >
                        <Plus size={14} />
                        Agregar variante
                    </button>
                </div>

                <div className="px-5 py-4 border-t border-stone-100 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
                    >
                        Listo
                    </button>
                </div>
            </div>
        </div>
    );
};
