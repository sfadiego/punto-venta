import { ShieldPlus, Plus } from "lucide-react";
import { useSuperAdminUsersSection } from "./useSuperAdminUsersSection";
import { SuperAdminUserTable } from "./SuperAdminUserTable";
import { SuperAdminUserModal } from "./SuperAdminUserModal";

export const SuperAdminUsersSection = () => {
    const { superAdmins, isLoading, modalUser, isModalOpen, openCreate, openEdit, closeModal } =
        useSuperAdminUsersSection();

    return (
        <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <ShieldPlus size={16} className="text-indigo-500" />
                    <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                        Super administradores
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={openCreate}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                    <Plus size={14} />
                    Nuevo
                </button>
            </div>

            <SuperAdminUserTable users={superAdmins} isLoading={isLoading} onEdit={openEdit} />

            {isModalOpen && <SuperAdminUserModal user={modalUser ?? null} onClose={closeModal} />}
        </section>
    );
};
