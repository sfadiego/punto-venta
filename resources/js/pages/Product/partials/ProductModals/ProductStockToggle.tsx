import { FormikProps } from "formik";
import { PackageSearch } from "lucide-react";
import { ToggleSwitch } from "@/components/ui/form/ToggleSwitch";
import { ProductForm } from "./useProductModal";

interface ProductStockToggleProps {
    formik: FormikProps<ProductForm>;
    disabled?: boolean;
    disabledMessage?: string;
}

export const ProductStockToggle = ({
    formik,
    disabled = false,
    disabledMessage = "No disponible para este negocio",
}: ProductStockToggleProps) => (
    <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Maneja stock</label>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50">
            <span className="w-9 h-9 shrink-0 rounded-lg border border-stone-200 bg-white flex items-center justify-center">
                <PackageSearch size={16} className="text-stone-500" />
            </span>
            <span className="text-sm text-stone-600 flex-1">
                {disabled ? disabledMessage : "Descuenta existencia en cada venta"}
            </span>
            <ToggleSwitch
                checked={formik.values.manage_stock}
                onChange={(v) => formik.setFieldValue("manage_stock", v)}
                disabled={disabled}
            />
        </div>
    </div>
);
