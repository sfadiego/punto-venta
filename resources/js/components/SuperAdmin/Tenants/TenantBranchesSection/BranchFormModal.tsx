import { createPortal } from "react-dom";
import { X, Store, Loader } from "lucide-react";
import { FormikProps } from "formik";
import { Input } from "@/components/ui/form/Input";
import { BranchForm } from "./useBranchFormModal";

interface BranchFormModalProps {
    isOpen: boolean;
    isEdit: boolean;
    formik: FormikProps<BranchForm>;
    onClose: () => void;
}

// Portal: esta sección vive dentro del <form> de edición del tenant en TenantFormPage —
// los <form> no pueden anidarse en HTML, así que este modal (con su propio <form>) se
// monta directo en document.body para escapar de ese árbol por completo.
export const BranchFormModal = ({ isOpen, isEdit, formik, onClose }: BranchFormModalProps) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Store size={16} className="text-slate-600" />
                        </div>
                        <h2 className="font-semibold text-slate-900 text-sm">
                            {isEdit ? "Editar sucursal" : "Nueva sucursal"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} noValidate className="p-5 space-y-4">
                    <Input<BranchForm>
                        name="name"
                        label="Nombre"
                        placeholder="Ej: Sucursal Centro"
                        formik={formik}
                    />
                    <Input<BranchForm>
                        name="address"
                        label="Dirección (opcional)"
                        placeholder="Calle, número, colonia"
                        formik={formik}
                    />

                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={formik.isSubmitting}
                            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2"
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
        </div>,
        document.body,
    );
};
