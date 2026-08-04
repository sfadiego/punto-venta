import { FormikProps } from "formik";
import { UnidadMedidaEnum, UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";
import { ProductForm } from "./useProductModal";

interface UnidadMedidaFieldProps {
    formik: FormikProps<ProductForm>;
}

export const UnidadMedidaField = ({ formik }: UnidadMedidaFieldProps) => (
    <div>
        <label className="block text-xs font-medium text-stone-600 mb-1.5">
            Unidad de medida <span className="text-red-400">*</span>
        </label>
        <div className="flex gap-2">
            {Object.values(UnidadMedidaEnum).map((u) => (
                <button
                    key={u}
                    type="button"
                    onClick={() => formik.setFieldValue("unidad_medida", u)}
                    className={`flex-1 py-2 rounded-xl border text-sm font-medium transition-colors ${
                        formik.values.unidad_medida === u
                            ? "border-amber-400 bg-amber-50 text-amber-700"
                            : "border-stone-200 bg-stone-50 text-stone-500 hover:border-stone-300"
                    }`}
                >
                    {UNIDAD_LABELS[u]}
                </button>
            ))}
        </div>
    </div>
);
