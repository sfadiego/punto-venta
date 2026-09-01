import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { trimDecimalZeros } from "@/utils/formatDecimal";
import { ProductForm } from "./useProductModal";

interface ProductStockFieldsProps {
    formik: FormikProps<ProductForm>;
    isEdit: boolean;
    wasManagingStock: boolean;
    currentStock?: string | null;
}

export const ProductStockFields = ({ formik, isEdit, wasManagingStock, currentStock }: ProductStockFieldsProps) => {
    if (!formik.values.manage_stock) return null;

    // Si el producto ya manejaba stock antes de abrir el modal, "Stock actual" es de solo
    // lectura (cada cambio se hace vía "Reabastecer stock", auditado). Si es una activación en
    // caliente (se acaba de encender el toggle sobre un producto que antes no lo manejaba) —
    // igual que al crear — sí se puede capturar el stock inicial aquí, porque no hay historial
    // que proteger todavía.
    const canCaptureInitialStock = !isEdit || !wasManagingStock;

    return (
        <div className="grid grid-cols-2 gap-3">
            {canCaptureInitialStock ? (
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
                    <p className="text-xs text-stone-400 mt-1">Existencia con la que arranca el producto.</p>
                </div>
            ) : (
                <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1.5">Stock actual</label>
                    <div className="px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm text-stone-600 tabular-nums">
                        {trimDecimalZeros(currentStock ?? 0)}
                    </div>
                    <p className="text-xs text-stone-400 mt-1">No se edita aquí — cada cambio queda auditado como movimiento.</p>
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
                    Cantidad mínima antes de marcar stock bajo; si se deja vacío, usa 2.
                </p>
            </div>
        </div>
    );
};
