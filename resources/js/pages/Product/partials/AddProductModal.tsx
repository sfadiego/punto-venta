import { X, Package, Loader } from "lucide-react";
import { FormikProps } from "formik";
import { ICategory } from "@/models/ICategory";
import { ProductForm } from "./useAddProductModal";
import { UnidadMedidaEnum, UNIDAD_LABELS } from "@/enums/UnidadMedidaEnum";

interface AddProductModalProps {
    isOpen: boolean;
    formik: FormikProps<ProductForm>;
    categories: ICategory[];
    sellByWeight: boolean;
    onClose: () => void;
}

export const AddProductModal = ({
    isOpen,
    formik,
    categories,
    sellByWeight,
    onClose,
}: AddProductModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Package size={16} className="text-amber-600" />
                        </div>
                        <h2 className="font-semibold text-stone-900 text-sm">Nuevo producto</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="p-5 space-y-4">
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
                            placeholder="Ej: Café americano"
                            autoFocus
                            className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                        />
                        {formik.touched.nombre && formik.errors.nombre && (
                            <p className="text-xs text-red-500 mt-1">{formik.errors.nombre}</p>
                        )}
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1.5">
                            Descripción
                        </label>
                        <textarea
                            name="descripcion"
                            value={formik.values.descripcion}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            placeholder="Descripción del producto (opcional)"
                            rows={2}
                            className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Precio */}
                        <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1.5">
                                Precio <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">
                                    $
                                </span>
                                <input
                                    name="precio"
                                    type="number"
                                    min="0"
                                    step="0.50"
                                    placeholder="0.00"
                                    value={formik.values.precio}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className="w-full pl-7 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent tabular-nums"
                                />
                            </div>
                            {formik.touched.precio && formik.errors.precio && (
                                <p className="text-xs text-red-500 mt-1">{formik.errors.precio}</p>
                            )}
                        </div>

                        {/* Categoría */}
                        <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1.5">
                                Categoría <span className="text-red-400">*</span>
                            </label>
                            <select
                                name="categoria_id"
                                value={formik.values.categoria_id}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
                            >
                                <option value="">Seleccionar...</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.nombre}
                                    </option>
                                ))}
                            </select>
                            {formik.touched.categoria_id && formik.errors.categoria_id && (
                                <p className="text-xs text-red-500 mt-1">{formik.errors.categoria_id}</p>
                            )}
                        </div>
                    </div>

                    {/* Unidad de medida */}
                    {sellByWeight && (
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
                    )}

                    {/* Activo */}
                    <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                        <div>
                            <p className="text-sm font-medium text-stone-700">Disponible</p>
                            <p className="text-xs text-stone-400">El producto aparece en el menú</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => formik.setFieldValue("activo", !formik.values.activo)}
                            className={`relative w-11 h-6 rounded-full transition-colors ${
                                formik.values.activo ? "bg-emerald-500" : "bg-stone-300"
                            }`}
                        >
                            <span
                                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                    formik.values.activo ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                        </button>
                    </div>

                    {/* Botones */}
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
                                    <Package size={14} />
                                    Crear producto
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
