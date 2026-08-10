import { FormikProps } from "formik";
import { ToggleSwitch } from "@/components/ui/form/ToggleSwitch";
import { ProductForm } from "./useProductModal";

interface ProductStockToggleProps {
    formik: FormikProps<ProductForm>;
}

export const ProductStockToggle = ({ formik }: ProductStockToggleProps) => (
    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
        <div>
            <p className="text-sm font-medium text-stone-700">Maneja stock</p>
            <p className="text-xs text-stone-400">Descuenta existencia en cada venta y bloquea si no alcanza</p>
        </div>
        <ToggleSwitch checked={formik.values.manage_stock} onChange={(v) => formik.setFieldValue("manage_stock", v)} />
    </div>
);
