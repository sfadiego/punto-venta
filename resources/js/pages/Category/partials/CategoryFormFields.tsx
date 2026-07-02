import { FormikProps } from "formik";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { CategoryForm } from "./useAddCategoryModal";

interface CategoryFormFieldsProps {
    formik: FormikProps<CategoryForm>;
}

export const CategoryFormFields = ({ formik }: CategoryFormFieldsProps) => (
    <div className="space-y-4">
        {/* Nombre */}
        <div>
            <label className="block text-xs font-medium text-stone-600 mb-1.5">
                Nombre <span className="text-red-400">*</span>
            </label>
            <input
                name="nombre"
                value={formik.values.nombre}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Ej: Bebidas calientes"
                maxLength={255}
                autoFocus
                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            />
            {formik.touched.nombre && formik.errors.nombre && (
                <p className="text-xs text-red-500 mt-1">{formik.errors.nombre}</p>
            )}
        </div>

        <div className="grid grid-cols-2 gap-3">
            {/* Orden */}
            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    Orden
                </label>
                <input
                    name="orden"
                    type="number"
                    min="0"
                    max={2147483647}
                    step={1}
                    placeholder="0"
                    value={formik.values.orden}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent tabular-nums"
                />
                {formik.touched.orden && formik.errors.orden && (
                    <p className="text-xs text-red-500 mt-1">{formik.errors.orden}</p>
                )}
            </div>

            {/* Ícono */}
            <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">
                    Ícono (Lucide)
                </label>
                <div className="flex gap-2">
                    <input
                        name="icon_name"
                        value={formik.values.icon_name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Coffee"
                        maxLength={100}
                        className="flex-1 min-w-0 px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    />
                    <div className="w-10 h-10 shrink-0 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-center">
                        <DynamicIcon
                            name={formik.values.icon_name || "Tag"}
                            size={18}
                            className="text-stone-500"
                        />
                    </div>
                </div>
                <p className="text-xs text-stone-400 mt-1">Nombre exacto del ícono en lucide.dev</p>
            </div>
        </div>
    </div>
);
