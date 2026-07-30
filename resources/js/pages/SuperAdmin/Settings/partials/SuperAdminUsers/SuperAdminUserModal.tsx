import { X, Loader } from "lucide-react";
import { IUser } from "@/models/IUser";
import { Input } from "@/components/ui/form/Input";
import { useSuperAdminUserModal } from "./useSuperAdminUserModal";

interface SuperAdminUserModalProps {
    user: IUser | null;
    onClose: () => void;
}

export const SuperAdminUserModal = ({ user, onClose }: SuperAdminUserModalProps) => {
    const { formik, isEdit } = useSuperAdminUserModal({ user, onClose });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-base font-semibold text-slate-900">
                        {isEdit ? "Editar super administrador" : "Nuevo super administrador"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={formik.handleSubmit} className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input formik={formik} name="nombre" label="Nombre" maxLength={100} />
                        <Input formik={formik} name="apellido_paterno" label="Apellido paterno" maxLength={100} />
                        <Input formik={formik} name="apellido_materno" label="Apellido materno" maxLength={100} />
                        <Input formik={formik} name="email" label="Correo electrónico" autoComplete="off" />
                        <Input formik={formik} name="usuario" label="Usuario" maxLength={80} autoComplete="off" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                        <Input
                            formik={formik}
                            name="password"
                            label={isEdit ? "Contraseña (dejar vacío para no cambiar)" : "Contraseña"}
                            inputType="password"
                            autoComplete="new-password"
                        />
                        <Input
                            formik={formik}
                            name="password_confirmation"
                            label="Confirmar contraseña"
                            inputType="password"
                            autoComplete="new-password"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={formik.isSubmitting}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                        >
                            {formik.isSubmitting && <Loader size={14} className="animate-spin" />}
                            {isEdit ? "Guardar cambios" : "Crear super administrador"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
