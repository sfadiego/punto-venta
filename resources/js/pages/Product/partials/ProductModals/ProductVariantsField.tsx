import { FormikProps } from "formik";
import { Plus, Trash2 } from "lucide-react";
import { ProductForm } from "./useProductModal";
import { useProductVariantsField } from "./useProductVariantsField";
import { Input } from "@/components/ui/form/Input";

interface ProductVariantsFieldProps {
    formik: FormikProps<ProductForm>;
}

export const ProductVariantsField = ({ formik }: ProductVariantsFieldProps) => {
    const { variants, updateVariant, addVariant, removeVariant, touchVariantField, getVariantError } =
        useProductVariantsField(formik);

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
                            <Input
                                name={`variant-nombre-${index}`}
                                placeholder="Ej: Chica, 250ml..."
                                value={variant.nombre}
                                onChange={(e) => updateVariant(index, { nombre: e.target.value })}
                                onBlur={() => touchVariantField(index, "nombre")}
                                error={getVariantError(index, "nombre")}
                            />
                        </div>
                        <div className="w-28">
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                                <Input
                                    name={`variant-precio-${index}`}
                                    inputType="number"
                                    min={0}
                                    step={0.5}
                                    placeholder="0.00"
                                    value={variant.precio}
                                    onChange={(e) => updateVariant(index, { precio: e.target.value })}
                                    onBlur={() => touchVariantField(index, "precio")}
                                    error={getVariantError(index, "precio")}
                                    className="pl-7 tabular-nums"
                                />
                            </div>
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
