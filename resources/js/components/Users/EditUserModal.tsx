import { X, Loader } from "lucide-react";
import { IUser } from "@/models/IUser";
import { RoleEnum } from "@/enums/RoleEnum";
import { Input } from "@/components/ui/form/Input";
import RoleSelect from "@/components/Role/RoleSelect";
import { useEditUserModal } from "./useEditUserModal";

interface EditUserModalProps {
    user: IUser | null;
    excludeRoles?: RoleEnum[];
    onClose: () => void;
}

export const EditUserModal = ({ user, excludeRoles = [], onClose }: EditUserModalProps) => {
    const { formik, isPending } = useEditUserModal(user, onClose);

    if (!user) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-[90vh]">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
                        <h2 className="text-sm font-semibold text-stone-800">Editar usuario</h2>
                        <button
                            onClick={onClose}
                            className="w-8 h-8 rounded-lg hover:bg-stone-100 flex items-center justify-center transition-colors"
                        >
                            <X size={16} className="text-stone-500" />
                        </button>
                    </div>

                    <form onSubmit={formik.handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                formik={formik}
                                name="nombre"
                                label="Nombre"
                                placeholder="Nombre"
                            />
                            <Input
                                formik={formik}
                                name="apellido_paterno"
                                label="Apellido paterno"
                                placeholder="Apellido paterno"
                            />
                        </div>

                        <Input
                            formik={formik}
                            name="apellido_materno"
                            label="Apellido materno (opcional)"
                            placeholder="Apellido materno"
                        />

                        <Input
                            formik={formik}
                            name="email"
                            label="Email"
                            placeholder="correo@ejemplo.com"
                            inputType="email"
                            autoComplete="off"
                        />

                        <Input
                            formik={formik}
                            name="usuario"
                            label="Usuario"
                            placeholder="nombre_usuario"
                            autoComplete="off"
                        />

                        <div>
                            <label className="block text-sm font-medium text-stone-700 mb-1.5">Rol</label>
                            <RoleSelect
                                name="rol_id"
                                value={formik.values.rol_id}
                                onChange={formik.handleChange}
                                excludeRoles={excludeRoles}
                            />
                            {formik.touched.rol_id && formik.errors.rol_id && (
                                <p className="text-red-500 text-xs mt-1">{formik.errors.rol_id}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={formik.values.activo}
                                onClick={() => formik.setFieldValue("activo", !formik.values.activo)}
                                className={`relative w-10 h-5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                                    formik.values.activo ? "bg-amber-500" : "bg-stone-200"
                                }`}
                            >
                                <span
                                    className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                                        formik.values.activo ? "translate-x-5" : "translate-x-0"
                                    }`}
                                />
                            </button>
                            <span className="text-sm text-stone-700">
                                {formik.values.activo ? "Activo" : "Inactivo"}
                            </span>
                        </div>

                        <Input
                            formik={formik}
                            name="password"
                            label="Nueva contraseña (opcional)"
                            placeholder="Dejar vacío para no cambiar"
                            inputType="password"
                            autoComplete="new-password"
                        />

                        <div className="pt-2 flex gap-3 justify-end shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-sm text-stone-600 hover:bg-stone-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={formik.isSubmitting || isPending}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
                            >
                                {(formik.isSubmitting || isPending) && (
                                    <Loader size={14} className="animate-spin" />
                                )}
                                Guardar cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};
