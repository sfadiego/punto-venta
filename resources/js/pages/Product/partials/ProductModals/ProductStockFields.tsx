import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { ProductForm } from "./useProductModal";

interface ProductStockFieldsProps {
    formik: FormikProps<ProductForm>;
    isEdit: boolean;
    currentStock?: string | null;
}

export const ProductStockFields = ({ formik, isEdit, currentStock }: ProductStockFieldsProps) => {
    if (!formik.values.manage_stock) return null;

    return (
        <div className="grid grid-cols-2 gap-3">
            {isEdit ? (
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Stock actual</label>
                    <div className="px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-600 tabular-nums">
                        {trimDecimalZeros(currentStock ?? 0)}
                    </div>
                    <p className="text-xs text-stone-400 mt-1">No se edita aquí — cada cambio queda auditado como movimiento.</p>
                </div>
            ) : (
                <div>
                    <Input<ProductForm>
                        name="stock"
                        label="Stock inicial"
                        inputType="number"
                        min={0}
                        step={1}
                        placeholder="0"
                        formik={formik}
                    />
                    <p className="text-xs text-stone-400 mt-1">Existencia con la que arranca el producto al crearlo.</p>
                </div>
            )}

            <div>
                <Input<ProductForm>
                    name="min_stock"
                    label="Stock mínimo"
                    inputType="number"
                    min={0}
                    step={1}
                    placeholder="2"
                    formik={formik}
                />
                <p className="text-xs text-stone-400 mt-1">
                    Se marca como stock bajo cuando la existencia llega a este nivel. Si se deja vacío, se usa 2 por defecto.
                </p>
            </div>
        </div>
    );
};
