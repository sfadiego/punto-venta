import { X, UserRound, Loader } from "lucide-react";
import { FormikProps } from "formik";
import { IEmployee } from "@/models/IEmployee";
import { EmployeeForm } from "./employeeForm";
import { EmployeeFormFields } from "./EmployeeFormFields";

interface EmployeeModalProps {
    isOpen: boolean;
    isEditing: boolean;
    employee: IEmployee | null;
    formik: FormikProps<EmployeeForm>;
    onClose: () => void;
}

export const EmployeeModal = ({ isOpen, isEditing, employee, formik, onClose }: EmployeeModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-stone-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <UserRound size={16} className="text-amber-600" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-stone-900 text-sm">
                                {isEditing ? "Editar empleado" : "Nuevo empleado"}
                            </h2>
                            {isEditing && employee && (
                                <p className="text-xs text-stone-400 mt-0.5 truncate max-w-[220px]">
                                    {employee.name}
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

                <form onSubmit={formik.handleSubmit} className="p-5">
                    <EmployeeFormFields formik={formik} />

                    <div className="flex gap-2 pt-5">
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
                                    <UserRound size={14} />
                                    {isEditing ? "Guardar cambios" : "Crear empleado"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
