import { X, PackagePlus, Loader } from "lucide-react";
import { FormikProps } from "formik";

type ExtraForm = {
    nombre: string;
    precio: string;
    cantidad: number;
};

interface AddExtraModalProps {
    isOpen: boolean;
    formik: FormikProps<ExtraForm>;
    onClose: () => void;
}

export const AddExtraModal = ({ isOpen, formik, onClose }: AddExtraModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
                            <PackagePlus size={16} className="text-violet-600" />
                        </div>
                        <h2 className="font-semibold text-stone-900 text-sm">Agregar extra</h2>
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
                            Descripción del extra
                        </label>
                        <input
                            name="nombre"
                            placeholder="Ej: Envío a domicilio, Servilletas extra..."
                            value={formik.values.nombre}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            maxLength={255}
                            autoFocus
                            className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent"
                        />
                        {formik.touched.nombre && formik.errors.nombre && (
                            <p className="text-xs text-red-500 mt-1">{formik.errors.nombre}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {/* Precio */}
                        <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1.5">
                                Precio
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                                <input
                                    name="precio"
                                    type="number"
                                    min="0"
                                    step="0.50"
                                    placeholder="0.00"
                                    value={formik.values.precio}
                                    onChange={formik.handleChange}
                                    onBlur={formik.handleBlur}
                                    className="w-full pl-7 pr-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent tabular-nums"
                                />
                            </div>
                            {formik.touched.precio && formik.errors.precio && (
                                <p className="text-xs text-red-500 mt-1">{formik.errors.precio}</p>
                            )}
                        </div>

                        {/* Cantidad */}
                        <div>
                            <label className="block text-xs font-medium text-stone-600 mb-1.5">
                                Cantidad
                            </label>
                            <input
                                name="cantidad"
                                type="number"
                                min="1"
                                max="99"
                                value={formik.values.cantidad}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                className="w-full px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent tabular-nums"
                            />
                        </div>
                    </div>

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
                            className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-violet-300 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                            {formik.isSubmitting ? (
                                <>
                                    <Loader size={14} className="animate-spin" />
                                    Agregando...
                                </>
                            ) : (
                                <>
                                    <PackagePlus size={14} />
                                    Agregar
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
