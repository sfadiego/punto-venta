import { RotateCcw, Save, ShieldCheck } from "lucide-react";
import { IBusinessFeatures } from "@/enums/BusinessTypeEnum";
import { PERMISSION_LABELS, ROLE_LABELS } from "@/utils/permissionUtils";
import { useTenantRolePermissionsSection } from "./useTenantRolePermissionsSection";

interface TenantRolePermissionsSectionProps {
    tenantId: number;
    features?: IBusinessFeatures;
}

export const TenantRolePermissionsSection = ({ tenantId, features }: TenantRolePermissionsSectionProps) => {
    const {
        configurableRoles,
        applicableActions,
        activeRole,
        setActiveRole,
        activeActions,
        toggle,
        handleSave,
        resetToDefault,
        saving,
        isLoading,
    } = useTenantRolePermissionsSection(tenantId, features);

    return (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={16} className="text-indigo-500" />
                <h2 className="text-sm font-semibold text-slate-900">Roles y permisos</h2>
            </div>
            <p className="text-xs text-slate-400 mb-5">
                Configura qué puede hacer cada rol dentro del sistema para este cliente, sin necesidad de
                iniciar sesión con sus credenciales.
            </p>

            <div className="flex flex-wrap gap-x-2 gap-y-1 mb-5 border-b border-slate-100">
                {configurableRoles.map((role) => (
                    <button
                        key={role}
                        type="button"
                        onClick={() => setActiveRole(role)}
                        className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            activeRole === role
                                ? "border-indigo-500 text-indigo-600"
                                : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        {ROLE_LABELS[role]}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex justify-center py-10">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                        {applicableActions.map((action) => (
                            <label
                                key={action}
                                className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer"
                            >
                                <input
                                    type="checkbox"
                                    checked={activeActions.has(action)}
                                    onChange={() => toggle(action)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                                />
                                {PERMISSION_LABELS[action]}
                            </label>
                        ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                        >
                            <Save size={15} />
                            {saving ? "Guardando…" : "Guardar cambios"}
                        </button>

                        <button
                            type="button"
                            onClick={resetToDefault}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-600 text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
                        >
                            <RotateCcw size={15} />
                            Restaurar por defecto
                        </button>
                    </div>
                </>
            )}
        </section>
    );
};
