import { FormikProps } from "formik";
import { ToggleSwitch } from "@/components/ui/form/ToggleSwitch";
import { ProductForm } from "./useProductModal";

interface ProductAvailabilityToggleProps {
    formik: FormikProps<ProductForm>;
}

export const ProductAvailabilityToggle = ({ formik }: ProductAvailabilityToggleProps) => (
    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
        <div>
            <p className="text-sm font-medium text-stone-700">Disponible</p>
            <p className="text-xs text-stone-400">El producto aparece en el menú</p>
        </div>
        <ToggleSwitch checked={formik.values.activo} onChange={(v) => formik.setFieldValue("activo", v)} />
    </div>
);
