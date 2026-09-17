import { X, Store, Loader } from "lucide-react";
import { FormikProps } from "formik";
import { BranchForm } from "./useBranchFormModal";
import { Input } from "@/components/ui/form/Input";

interface BranchFormModalProps {
    isOpen: boolean;
    isEdit: boolean;
    formik: FormikProps<BranchForm>;
    onClose: () => void;
}

export const BranchFormModal = ({ isOpen, isEdit, formik, onClose }: BranchFormModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <Store size={16} className="text-amber-600" />
                        </div>
                        <h2 className="font-semibold text-stone-900 text-sm">
                            {isEdit ? "Editar sucursal" : "Nueva sucursal"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="p-5 space-y-4">
                    <Input<BranchForm>
                        name="name"
                        label="Nombre *"
                        formik={formik}
                        placeholder="Ej: Sucursal Centro"
                        maxLength={100}
                    />
                    <Input<BranchForm>
                        name="address"
                        label="Dirección (opcional)"
                        formik={formik}
                        placeholder="Calle, número, colonia"
                        maxLength={500}
                    />
                    <Input<BranchForm>
                        name="phone"
                        label="Teléfono (opcional)"
                        formik={formik}
                        placeholder="Teléfono de contacto"
                        maxLength={20}
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
                                    {isEdit ? "Guardando..." : "Creando..."}
                                </>
                            ) : isEdit ? (
                                "Guardar cambios"
                            ) : (
                                "Crear sucursal"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
