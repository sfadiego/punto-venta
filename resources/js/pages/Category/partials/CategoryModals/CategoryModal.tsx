import { X, Tag, Loader } from "lucide-react";
import { FormikProps } from "formik";
import { CategoryForm } from "./useCategoryModal";
import { Input } from "@/components/ui/form/Input";
import { IconPickerField } from "@/components/ui/IconPickerField";

interface CategoryModalProps {
    isOpen: boolean;
    isEdit: boolean;
    formik: FormikProps<CategoryForm>;
    onClose: () => void;
}

export const CategoryModal = ({ isOpen, isEdit, formik, onClose }: CategoryModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Tag size={16} className="text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-stone-900 text-sm">
                                {isEdit ? "Editar categoría" : "Nueva categoría"}
                            </h2>
                            {isEdit && (
                                <p className="text-xs text-stone-400 mt-0.5 truncate max-w-[220px]">
                                    {formik.values.nombre}
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="p-5 space-y-4">
                    <Input<CategoryForm>
                        name="nombre"
                        label="Nombre *"
                        formik={formik}
                        placeholder="Ej: Bebidas calientes"
                        maxLength={255}
                    />

                    <div>
                        <Input<CategoryForm>
                            name="orden"
                            label="Orden"
                            inputType="number"
                            min={0}
                            max={2147483647}
                            step={1}
                            placeholder="0"
                            formik={formik}
                            className="tabular-nums"
                        />
                        <p className="text-xs text-stone-400 mt-1">
                            Define en qué posición aparece esta categoría al mostrarse en el sistema. Menor número, más arriba.
                        </p>
                    </div>

                    <IconPickerField
                        iconName={formik.values.icon_name}
                        iconSource={formik.values.icon_source}
                        onChange={(name, source) => {
                            formik.setFieldValue("icon_name", name);
                            formik.setFieldValue("icon_source", source);
                        }}
                    />

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={formik.isSubmitting}
                            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {formik.isSubmitting ? (
                                <>
                                    <Loader size={14} className="animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Tag size={14} />
                                    {isEdit ? "Guardar cambios" : "Crear categoría"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
