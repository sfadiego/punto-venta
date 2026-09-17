import { Loader, Plus, Store } from "lucide-react";
import { useTenantBranchesSection } from "./useTenantBranchesSection";
import { useBranchFormModal } from "./useBranchFormModal";
import { BranchFormModal } from "./BranchFormModal";
import { BranchCard } from "./BranchCard";

interface TenantBranchesSectionProps {
    tenantId: number;
    multiBranchEnabled: boolean;
}

export const TenantBranchesSection = ({ tenantId, multiBranchEnabled }: TenantBranchesSectionProps) => {
    const { branches, isLoading, handleEnable, enabling, handleToggleActive } = useTenantBranchesSection(tenantId);
    const { isOpen, openCreate, openEdit, handleClose, formik, isEdit } = useBranchFormModal(tenantId);

    return (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
                        <Store size={17} className="text-slate-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900">Sucursales</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Activa el soporte de múltiples sucursales y da de alta las que este cliente necesita.
                        </p>
                    </div>
                </div>
                {multiBranchEnabled && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Activo
                    </span>
                )}
            </div>

            {!multiBranchEnabled ? (
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={handleEnable}
                        disabled={enabling}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                    >
                        {enabling && <Loader size={14} className="animate-spin" />}
                        {enabling ? "Activando…" : "Activar sucursales"}
                    </button>
                </div>
            ) : (
                <>
                    {isLoading ? (
                        <div className="flex justify-center py-6">
                            <Loader size={18} className="animate-spin text-slate-400" />
                        </div>
                    ) : (branches ?? []).length === 0 ? (
                        <p className="text-sm text-slate-400 text-center py-6 mt-4">Sin sucursales todavía.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4 mb-4">
                            {branches?.map((branch) => (
                                <BranchCard
                                    key={branch.id}
                                    branch={branch}
                                    onToggleActive={() => handleToggleActive(branch)}
                                    onEdit={() => openEdit(branch)}
                                />
                            ))}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
                    >
                        <Plus size={15} />
                        Agregar sucursal
                    </button>

                    <BranchFormModal isOpen={isOpen} isEdit={isEdit} formik={formik} onClose={handleClose} />
                </>
            )}
        </section>
    );
};
