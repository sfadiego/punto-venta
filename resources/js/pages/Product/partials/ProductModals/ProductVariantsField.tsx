import { FormikProps } from "formik";
import { Plus, Trash2 } from "lucide-react";
import { ProductForm, ProductVariantFormValue } from "./useProductModal";

interface ProductVariantsFieldProps {
    formik: FormikProps<ProductForm>;
}

export const ProductVariantsField = ({ formik }: ProductVariantsFieldProps) => {
    const { variants } = formik.values;

    const updateVariant = (index: number, patch: Partial<ProductVariantFormValue>) => {
        const next = variants.map((v, i) => (i === index ? { ...v, ...patch } : v));
        formik.setFieldValue("variants", next);
    };

    const addVariant = () => {
        formik.setFieldValue("variants", [...variants, { nombre: "", precio: "" }]);
    };

    const removeVariant = (index: number) => {
        formik.setFieldValue(
            "variants",
            variants.filter((_, i) => i !== index),
        );
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-stone-700">Variantes (opcional)</label>
            </div>
            {variants.length > 0 && (
                <p className="text-xs text-stone-400">
                    El precio base solo aplica si el producto no tiene variantes activas.
                </p>
            )}

            <div className="space-y-2">
                {variants.map((variant, index) => (
                    <div key={index} className="flex items-start gap-2">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Ej: Chica, 250ml..."
                                value={variant.nombre}
                                onChange={(e) => updateVariant(index, { nombre: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded-xl border border-stone-200 focus:border-amber-400 focus:outline-none"
                            />
                        </div>
                        <div className="w-28 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                                $
                            </span>
                            <input
                                type="number"
                                min={0}
                                step={0.5}
                                placeholder="0.00"
                                value={variant.precio}
                                onChange={(e) => updateVariant(index, { precio: e.target.value })}
                                className="w-full pl-7 pr-2 py-2 text-sm rounded-xl border border-stone-200 focus:border-amber-400 focus:outline-none tabular-nums"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => removeVariant(index)}
                            className="p-2 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-red-500 transition-colors"
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
        </div>
    );
};
