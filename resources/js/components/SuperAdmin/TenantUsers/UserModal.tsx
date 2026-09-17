import { X, Loader } from "lucide-react";
import { IUser } from "@/models/IUser";
import { useUserModal } from "./useUserModal";
import RoleSelect from "@/components/Role/RoleSelect";
import { Input } from "@/components/ui/form/Input";
import { BusinessTypeEnum } from "@/enums/BusinessTypeEnum";
import { RoleEnum } from "@/enums/RoleEnum";
import { useListTenantBranches } from "@/services/useTenantBranchService";

interface UserModalProps {
    tenantId: number;
    tenantSlug: string;
    tipoNegocio: BusinessTypeEnum;
    user: IUser | null;
    onClose: () => void;
}

const ROLES_SIN_COCINA = [RoleEnum.Cocina];

export const UserModal = ({ tenantId, tenantSlug, tipoNegocio, user, onClose }: UserModalProps) => {
    const excludeRoles = tipoNegocio !== BusinessTypeEnum.Restaurante ? ROLES_SIN_COCINA : [];
    const { formik, isEdit, isLoadingBranches } = useUserModal({ tenantId, tenantSlug, user, onClose });
    const { data: branches } = useListTenantBranches(tenantId);

    // Admin siempre tiene acceso a todas las sucursales (sin fila en user_branch), y solo
    // aplica si el tenant ya tiene sucursales dadas de alta. Al editar, se espera a que
    // cargue la asignación actual del usuario antes de mostrar el checklist, para no
    // pintar "sin sucursales" por un instante cuando en realidad sí tiene.
    const showBranchPicker =
        Number(formik.values.rol_id) !== RoleEnum.Admin
        && (branches?.length ?? 0) > 0
        && !(isEdit && isLoadingBranches);

    const toggleBranch = (branchId: number) => {
        const current: number[] = formik.values.branch_ids;
        const next = current.includes(branchId)
            ? current.filter((id) => id !== branchId)
            : [...current, branchId];
        formik.setFieldValue("branch_ids", next);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-base font-semibold text-slate-900">
                        {isEdit ? "Editar usuario" : "Nuevo usuario"}
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
                        <Input
                            formik={formik}
                            name="email"
                            label="Correo electrónico"
                            inputType="text"
                            autoComplete="off"
                            onFocus={(e) => {
                                if (!isEdit && formik.values.email.startsWith("@")) {
                                    e.target.setSelectionRange(0, 0);
                                }
                            }}
                        />
                        <Input formik={formik} name="usuario" label="Usuario" maxLength={80} autoComplete="off" />
                        <div>

                            <Input
                                formik={formik}
                                name="password"
                                label={"Contraseña"}
                                inputType="password"
                                autoComplete="new-password"
                            />
                            <p className="text-sm text-slate-500">
                                {isEdit
                                    ? "Vacío no cambia la contraseña"
                                    : ""}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Rol</label>
                            <RoleSelect
                                value={formik.values.rol_id}
                                onChange={formik.handleChange}
                                excludeRoles={excludeRoles}
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-6">
                            <button
                                type="button"
                                onClick={() => formik.setFieldValue("activo", !formik.values.activo)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formik.values.activo ? "bg-indigo-600" : "bg-slate-200"
                                    }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${formik.values.activo ? "translate-x-6" : "translate-x-1"
                                        }`}
                                />
                            </button>
                            <span className="text-sm text-slate-600">
                                {formik.values.activo ? "Activo" : "Inactivo"}
                            </span>
                        </div>
                    </div>

                    {showBranchPicker && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Sucursales asignadas
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3">
                                {branches?.map((branch) => (
                                    <label
                                        key={branch.id}
                                        className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formik.values.branch_ids.includes(branch.id)}
                                            onChange={() => toggleBranch(branch.id)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        {branch.name}
                                    </label>
                                ))}
                            </div>
                            {formik.values.branch_ids.length === 0 && (
                                <p className="text-xs text-slate-400 mt-1">
                                    Sin sucursales seleccionadas: este usuario no podrá abrir caja hasta que se le asigne una.
                                </p>
                            )}
                        </div>
                    )}

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
                            {isEdit ? "Guardar cambios" : "Crear usuario"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
