import { X, PackagePlus, Loader } from "lucide-react";
import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";

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
                    <Input<ExtraForm>
                        label="Descripción del extra"
                        name="nombre"
                        placeholder="Ej: Envío a domicilio, Servilletas extra..."
                        formik={formik}
                        maxLength={255}
                    />

                    <div className="grid grid-cols-2 gap-3">
                        {/* Precio */}
                        <Input<ExtraForm>
                            label="Precio"
                            name="precio"
                            inputType="number"
                            min={0}
                            max={99999}
                            step={0.5}
                            placeholder="$0.00"
                            formik={formik}
                        />

                        {/* Cantidad */}
                        <Input<ExtraForm>
                            label="Cantidad"
                            name="cantidad"
                            inputType="number"
                            min={1}
                            max={99}
                            step={1}
                            formik={formik}
                        />
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
