import { FormikProps } from "formik";
import { Eye } from "lucide-react";
import { ToggleSwitch } from "@/components/ui/form/ToggleSwitch";
import { ProductForm } from "./useProductModal";

interface ProductAvailabilityToggleProps {
    formik: FormikProps<ProductForm>;
}

export const ProductAvailabilityToggle = ({ formik }: ProductAvailabilityToggleProps) => (
    <div>
        <label className="block text-sm font-medium text-stone-700 mb-1.5">Disponible</label>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50">
            <span className="w-9 h-9 shrink-0 rounded-lg border border-stone-200 bg-white flex items-center justify-center">
                <Eye size={16} className="text-stone-500" />
            </span>
            <span className="text-sm text-stone-600 whitespace-nowrap flex-1">El producto aparece en el menú</span>
            <ToggleSwitch checked={formik.values.activo} onChange={(v) => formik.setFieldValue("activo", v)} />
        </div>
    </div>
);
