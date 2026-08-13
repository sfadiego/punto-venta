import { FormikProps } from "formik";
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
    disabledMessage = "No disponible para este tipo de negocio",
}: ProductStockToggleProps) => (
    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
        <div>
            <p className="text-sm font-medium text-stone-700">Maneja stock</p>
            <p className="text-xs text-stone-400">
                {disabled ? disabledMessage : "Descuenta existencia en cada venta y bloquea si no alcanza"}
            </p>
        </div>
        <ToggleSwitch
            checked={formik.values.manage_stock}
            onChange={(v) => formik.setFieldValue("manage_stock", v)}
            disabled={disabled}
        />
    </div>
);
